import { Request, Response } from 'express';
import path from 'path';
import { CertificateService } from '../services/certificate.service';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/apiError';

export class CertificateController {
  /**
   * Generates or retrieves certificate for current authenticated user
   */
  static async generateCertificate(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw ApiError.unauthorized('Authentication required.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, targetRole: true, readinessScore: true },
    });

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const currentScore = user.readinessScore || 0;
    if (currentScore < 100) {
      return res.status(400).json({
        success: false,
        message: `Readiness score is ${currentScore}%. Certificate requires 100% Readiness Mastery.`,
        currentScore,
        requiredScore: 100,
      });
    }

    // Check if certificate already issued
    const existing = await CertificateService.findCertificateByUserId(userId);
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already generated and verified.',
        certificate: existing,
      });
    }

    // Generate new verified certificate
    const cert = await CertificateService.issueCertificate({
      userId: user.id,
      candidateName: user.name,
      targetRole: user.targetRole || 'Full Stack Developer',
      email: user.email,
      score: '100% MASTERY',
    });

    return res.status(201).json({
      success: true,
      message: 'Certificate generated successfully and emailed to candidate.',
      certificate: cert,
    });
  }

  /**
   * Retrieves certificate info for currently authenticated user
   */
  static async getMyCertificate(req: Request, res: Response) {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw ApiError.unauthorized('Authentication required.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, targetRole: true, readinessScore: true },
    });

    if (!user) {
      throw ApiError.notFound('User not found.');
    }

    const cert = await CertificateService.findCertificateByUserId(userId);

    return res.status(200).json({
      success: true,
      hasCertificate: Boolean(cert),
      readinessScore: user.readinessScore || 0,
      isEligible: (user.readinessScore || 0) >= 100,
      certificate: cert,
    });
  }

  /**
   * Downloads the certificate PDF file
   */
  static async downloadCertificate(req: Request, res: Response) {
    const { credentialId } = req.params;
    const cleanId = Array.isArray(credentialId) ? credentialId[0] : credentialId;
    if (!cleanId) {
      throw ApiError.badRequest('Credential ID is required.');
    }

    const pdfPath = CertificateService.getCertificatePdfPath(cleanId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="AIM-Certificate-${cleanId}.pdf"`);
    return res.sendFile(path.resolve(pdfPath));
  }

  /**
   * Public verification endpoint to verify any credential ID
   */
  static async verifyCertificate(req: Request, res: Response) {
    const { credentialId } = req.params;
    const cleanId = Array.isArray(credentialId) ? credentialId[0] : credentialId;
    if (!cleanId) {
      throw ApiError.badRequest('Credential ID is required.');
    }

    const cert = await CertificateService.verifyCredential(cleanId);

    return res.status(200).json({
      success: true,
      verified: true,
      certificate: {
        credentialId: cert.credentialId,
        candidateName: cert.candidateName,
        targetRole: cert.targetRole,
        score: cert.score,
        issueDate: cert.issueDate,
        status: cert.status,
        pdfUrl: cert.pdfUrl,
      },
    });
  }
}
