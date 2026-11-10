import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import ExcelJS from 'exceljs';
import { prisma } from '../config/prisma';
import { EmailService } from './email.service';
import { ApiError } from '../utils/apiError';

export interface GenerateCertOptions {
  userId?: string;
  candidateName: string;
  targetRole: string;
  email: string;
  score?: string;
  credentialId?: string;
}

export interface IssuedCertificateRecord {
  id?: string;
  credentialId: string;
  candidateName: string;
  targetRole: string;
  email: string;
  score: string;
  issueDate: string;
  pdfUrl: string;
  pdfPath: string;
  status: string;
}

function resolveBasePath(...segments: string[]): string {
  if (path.basename(process.cwd()).toLowerCase() === 'backend') {
    return path.resolve(process.cwd(), ...segments);
  }
  const backendPath = path.resolve(process.cwd(), 'backend', ...segments);
  if (fs.existsSync(backendPath) || segments[0] === 'uploads') {
    return backendPath;
  }
  return path.resolve(__dirname, '..', '..', ...segments);
}

export class CertificateService {
  private static get baseDir(): string {
    return resolveBasePath('certificate generator');
  }

  private static get templatePath(): string {
    return path.join(this.baseDir, 'Certificate_Template.docx');
  }

  private static get excelPath(): string {
    return path.join(this.baseDir, 'Issued_Certificates_Registry.xlsx');
  }

  private static get scriptPath(): string {
    return path.join(this.baseDir, 'generate_certificate.py');
  }

  private static get uploadDir(): string {
    const dir = resolveBasePath('uploads', 'certificates');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Generates a unique Credential ID: AIM-CERT-YYYY-XXXXXX
   */
  static generateCredentialId(): string {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
    return `AIM-CERT-${year}-${randomNum}`;
  }

  /**
   * Generates enterprise PDF certificate, saves to DB + Excel registry, and emails candidate.
   */
  static async issueCertificate(options: GenerateCertOptions): Promise<IssuedCertificateRecord> {
    const {
      candidateName,
      targetRole = 'Full Stack Developer',
      email,
      score = '100% MASTERY',
    } = options;

    const credentialId = options.credentialId || this.generateCredentialId();
    const outputPdfPath = path.join(this.uploadDir, `${credentialId}.pdf`);

    // Run Python generator script
    await new Promise<void>((resolve, reject) => {
      const args = [
        this.scriptPath,
        '--name', candidateName,
        '--role', targetRole,
        '--email', email,
        '--score', score,
        '--credential-id', credentialId,
        '--output-pdf', outputPdfPath,
        '--excel-path', this.excelPath,
        '--template-path', this.templatePath,
      ];

      const pythonProcess = spawn('python', args, { cwd: this.baseDir });
      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (chunk) => { stdoutData += chunk.toString(); });
      pythonProcess.stderr.on('data', (chunk) => { stderrData += chunk.toString(); });

      pythonProcess.on('close', (code) => {
        if (code === 0 && fs.existsSync(outputPdfPath)) {
          resolve();
        } else {
          console.error('[CertificateService] Python generator error:', stderrData || stdoutData);
          reject(new Error(`PDF generation failed (exit ${code}): ${stderrData || stdoutData}`));
        }
      });

      pythonProcess.on('error', reject);
    });

    const pdfUrl = `/uploads/certificates/${credentialId}.pdf`;
    const issueDate = new Date();

    // Save to PostgreSQL database
    let dbRecord: any = null;
    try {
      // Resolve userId: use provided, or look up by email
      let userId = options.userId;
      if (!userId) {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          select: { id: true },
        });
        userId = user?.id;
      }

      if (userId) {
        dbRecord = await prisma.certificate.create({
          data: {
            userId,
            credentialId,
            candidateName,
            targetRole,
            score,
            pdfUrl,
            issueDate,
            status: 'ACTIVE',
          },
        });
        console.log(`[CertificateService] Certificate ${credentialId} saved to database`);
      }
    } catch (dbErr: any) {
      console.warn(`[CertificateService] DB save warning: ${dbErr.message}`);
    }

    // Dispatch verified email with PDF attachment
    try {
      await EmailService.sendCertificateEmail({
        toEmail: email,
        userName: candidateName,
        targetRole,
        credentialId,
        score,
        pdfPath: outputPdfPath,
      });
    } catch (emailErr: any) {
      console.warn(`[CertificateService] Email delivery warning: ${emailErr.message}`);
    }

    return {
      id: dbRecord?.id,
      credentialId,
      candidateName,
      targetRole,
      email,
      score,
      issueDate: issueDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      pdfUrl,
      pdfPath: outputPdfPath,
      status: 'ACTIVE',
    };
  }

  /**
   * Checks if user has achieved 100% readiness and issues certificate if not yet created
   */
  static async checkAndIssueForUser(userId: string): Promise<IssuedCertificateRecord | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, targetRole: true, readinessScore: true },
    });

    if (!user) return null;
    if ((user.readinessScore || 0) < 100) return null;

    // Check database first
    const existing = await this.findCertificateByUserId(userId);
    if (existing) return existing;

    return await this.issueCertificate({
      userId: user.id,
      candidateName: user.name,
      targetRole: user.targetRole || 'Full Stack Developer',
      email: user.email,
      score: '100% MASTERY',
    });
  }

  /**
   * Finds certificate by userId from database
   */
  static async findCertificateByUserId(userId: string): Promise<IssuedCertificateRecord | null> {
    const cert = await prisma.certificate.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!cert) return null;

    return {
      id: cert.id,
      credentialId: cert.credentialId,
      candidateName: cert.candidateName,
      targetRole: cert.targetRole,
      email: '', // Not stored in DB, privacy
      score: cert.score,
      issueDate: cert.issueDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
      pdfUrl: cert.pdfUrl,
      pdfPath: path.join(this.uploadDir, `${cert.credentialId}.pdf`),
      status: cert.status,
    };
  }

  /**
   * Finds certificate by email - checks DB first, falls back to Excel
   */
  static async findCertificateByEmail(email: string): Promise<IssuedCertificateRecord | null> {
    const cleanEmail = email.toLowerCase().trim();

    // Check database first
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true },
    });

    if (user) {
      const dbCert = await this.findCertificateByUserId(user.id);
      if (dbCert) {
        dbCert.email = cleanEmail;
        return dbCert;
      }
    }

    // Fallback to Excel registry for legacy records
    return this.findCertificateInExcel(cleanEmail);
  }

  /**
   * Legacy Excel registry lookup
   */
  private static async findCertificateInExcel(email: string): Promise<IssuedCertificateRecord | null> {
    if (!fs.existsSync(this.excelPath)) return null;

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(this.excelPath);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) return null;

      let foundRecord: IssuedCertificateRecord | null = null;
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1 || foundRecord) return;
        const rowEmail = String(row.getCell(3).value || '').toLowerCase().trim();
        if (rowEmail === email) {
          const credId = String(row.getCell(5).value || '').trim();
          foundRecord = {
            issueDate: String(row.getCell(1).value || ''),
            candidateName: String(row.getCell(2).value || ''),
            email: String(row.getCell(3).value || ''),
            targetRole: String(row.getCell(4).value || ''),
            credentialId: credId,
            status: String(row.getCell(6).value || 'ACTIVE'),
            score: '100% MASTERY',
            pdfUrl: `/uploads/certificates/${credId}.pdf`,
            pdfPath: path.join(this.uploadDir, `${credId}.pdf`),
          };
        }
      });
      return foundRecord;
    } catch (e: any) {
      console.warn('[CertificateService] Excel fallback warning:', e.message);
      return null;
    }
  }

  /**
   * Verifies a certificate by Credential ID - checks DB first, falls back to Excel
   */
  static async verifyCredential(credentialId: string): Promise<IssuedCertificateRecord> {
    const cleanId = credentialId.trim().toUpperCase();

    // Check database first
    const dbCert = await prisma.certificate.findFirst({
      where: { credentialId: { equals: credentialId.trim(), mode: 'insensitive' } },
      include: {
        user: {
          select: { email: true, readinessScore: true, skills: true, experienceLevel: true },
        },
      },
    });

    if (dbCert) {
      return {
        id: dbCert.id,
        credentialId: dbCert.credentialId,
        candidateName: dbCert.candidateName,
        targetRole: dbCert.targetRole,
        email: dbCert.user.email,
        score: dbCert.score,
        issueDate: dbCert.issueDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
        pdfUrl: dbCert.pdfUrl,
        pdfPath: path.join(this.uploadDir, `${dbCert.credentialId}.pdf`),
        status: dbCert.status,
      };
    }

    // Fallback to Excel for legacy records
    if (fs.existsSync(this.excelPath)) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(this.excelPath);
      const worksheet = workbook.worksheets[0];
      if (worksheet) {
        let foundRecord: IssuedCertificateRecord | null = null;
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1 || foundRecord) return;
          const rowCredId = String(row.getCell(5).value || '').trim().toUpperCase();
          if (rowCredId === cleanId) {
            foundRecord = {
              issueDate: String(row.getCell(1).value || ''),
              candidateName: String(row.getCell(2).value || ''),
              email: String(row.getCell(3).value || ''),
              targetRole: String(row.getCell(4).value || ''),
              credentialId: String(row.getCell(5).value || '').trim(),
              status: String(row.getCell(6).value || 'ACTIVE'),
              score: '100% MASTERY',
              pdfUrl: `/uploads/certificates/${cleanId}.pdf`,
              pdfPath: path.join(this.uploadDir, `${cleanId}.pdf`),
            };
          }
        });
        if (foundRecord) return foundRecord;
      }
    }

    throw ApiError.notFound(`Credential ID '${credentialId}' was not found in the verified registry.`);
  }

  /**
   * Returns the absolute file path for a certificate PDF (for download)
   */
  static getCertificatePdfPath(credentialId: string): string {
    const pdfPath = path.join(this.uploadDir, `${credentialId}.pdf`);
    if (!fs.existsSync(pdfPath)) {
      throw ApiError.notFound('Certificate PDF file not found on server.');
    }
    return pdfPath;
  }
}
