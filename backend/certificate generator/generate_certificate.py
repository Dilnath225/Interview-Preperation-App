import os
import sys
import argparse
import json
import shutil
import subprocess
from datetime import datetime
from docx import Document
import openpyxl

# Platform-specific imports for DOCX to PDF conversion
IS_WINDOWS = sys.platform == "win32"
if IS_WINDOWS:
    try:
        import pythoncom
        from docx2pdf import convert
    except ImportError:
        pythoncom = None
        convert = None
else:
    pythoncom = None
    convert = None

def convert_docx_to_pdf(docx_path: str, output_pdf_path: str):
    dir_name = os.path.dirname(output_pdf_path)
    os.makedirs(dir_name, exist_ok=True)

    if IS_WINDOWS and convert is not None:
        if pythoncom:
            pythoncom.CoInitialize()
        try:
            convert(docx_path, output_pdf_path)
        finally:
            if pythoncom:
                pythoncom.CoUninitialize()
    else:
        # Linux / Docker container conversion using headless LibreOffice / soffice
        office_bin = shutil.which("libreoffice") or shutil.which("soffice")
        if not office_bin:
            raise RuntimeError(
                "Neither Microsoft Word (Windows) nor LibreOffice (Linux/Docker) was found for DOCX to PDF conversion."
            )

        cmd = [
            office_bin,
            "--headless",
            "--convert-to",
            "pdf",
            docx_path,
            "--outdir",
            dir_name,
        ]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if proc.returncode != 0:
            raise RuntimeError(f"LibreOffice PDF conversion failed: {proc.stderr or proc.stdout}")

        # LibreOffice outputs <base_name>.pdf in dir_name
        base_name = os.path.splitext(os.path.basename(docx_path))[0]
        generated_pdf = os.path.join(dir_name, f"{base_name}.pdf")

        if os.path.exists(generated_pdf) and os.path.abspath(generated_pdf) != os.path.abspath(output_pdf_path):
            shutil.move(generated_pdf, output_pdf_path)

    if not os.path.exists(output_pdf_path):
        raise FileNotFoundError(f"Generated PDF was not found at expected location: {output_pdf_path}")

def generate_certificate(name: str, role: str, email: str, score: str, credential_id: str, output_pdf: str, excel_path: str, template_path: str):
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template not found at: {template_path}")

    # 1. Load Word template
    doc = Document(template_path)
    issue_date_str = datetime.now().strftime("%d %B %Y")
    excel_date_str = datetime.now().strftime("%Y-%m-%d")

    replacements = {
        "{{CANDIDATE_NAME}}": name,
        "{{TARGET_ROLE}}": role,
        "{{SCORE}}": score,
        "{{CREDENTIAL_ID}}": credential_id,
        "{{ISSUE_DATE}}": issue_date_str
    }

    # Replace placeholders in all text elements across the entire document (including nested tables)
    for t in doc._element.xpath('//w:t'):
        if t.text:
            for key, val in replacements.items():
                if key in t.text:
                    t.text = t.text.replace(key, val)

    # Temporary docx file
    dir_name = os.path.dirname(output_pdf)
    if not os.path.exists(dir_name):
        os.makedirs(dir_name, exist_ok=True)

    temp_docx = os.path.join(dir_name, f"temp_{credential_id}.docx")
    doc.save(temp_docx)

    # 2. Convert to PDF cross-platform
    try:
        convert_docx_to_pdf(temp_docx, output_pdf)
    finally:
        # Clean up temp docx
        if os.path.exists(temp_docx):
            try:
                os.remove(temp_docx)
            except Exception:
                pass

    # 3. Update Excel Registry (if present)
    if os.path.exists(excel_path):
        try:
            wb = openpyxl.load_workbook(excel_path)
            ws = wb.active
            
            # Check if credential_id already logged
            already_logged = False
            for row in ws.iter_rows(values_only=True):
                if len(row) > 4 and row[4] == credential_id:
                    already_logged = True
                    break

            if not already_logged:
                ws.append([
                    excel_date_str,
                    name,
                    email,
                    role,
                    credential_id,
                    "Active"
                ])
                wb.save(excel_path)
        except Exception as excel_err:
            print(f"[WARN] Could not update Excel registry: {excel_err}", file=sys.stderr)

    result = {
        "success": True,
        "credentialId": credential_id,
        "pdfPath": output_pdf,
        "issueDate": issue_date_str,
        "name": name,
        "role": role,
        "score": score
    }
    print(json.dumps(result))
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate AI Mentor Certificate")
    parser.add_argument("--name", required=True, help="Candidate Name")
    parser.add_argument("--role", default="Full Stack Developer", help="Target Role")
    parser.add_argument("--email", default="", help="Candidate Email")
    parser.add_argument("--score", default="100% MASTERY", help="Score achieved")
    parser.add_argument("--credential-id", required=True, help="Unique Credential ID")
    parser.add_argument("--output-pdf", required=True, help="Destination PDF file path")
    parser.add_argument("--excel-path", required=True, help="Path to Issued_Certificates_Registry.xlsx")
    parser.add_argument("--template-path", required=True, help="Path to Certificate_Template.docx")

    args = parser.parse_args()

    try:
        generate_certificate(
            name=args.name,
            role=args.role,
            email=args.email,
            score=args.score,
            credential_id=args.credential_id,
            output_pdf=args.output_pdf,
            excel_path=args.excel_path,
            template_path=args.template_path
        )
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)
