import os
import sys
import argparse
import json
from datetime import datetime
from docx import Document
from docx2pdf import convert
import openpyxl
import pythoncom

def generate_certificate(name: str, role: str, email: str, score: str, credential_id: str, output_pdf: str, excel_path: str, template_path: str):
    pythoncom.CoInitialize()
    try:
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

        # 2. Convert to PDF using Word COM interop
        convert(temp_docx, output_pdf)

        # Clean up temp docx
        if os.path.exists(temp_docx):
            try:
                os.remove(temp_docx)
            except Exception:
                pass

        # 3. Update Excel Registry
        if os.path.exists(excel_path):
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

    finally:
        pythoncom.CoUninitialize()

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

