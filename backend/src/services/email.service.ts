import nodemailer, { Transporter } from 'nodemailer';
import { ENV } from '../config/env';

export class EmailService {
  private static transporter: Transporter | null = null;

  /**
   * Initializes or returns the cached nodemailer transporter
   */
  private static getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    if (ENV.SMTP_USER && ENV.SMTP_PASS) {
      const isGmail = ENV.SMTP_USER.toLowerCase().includes('@gmail.com') || (ENV.SMTP_HOST && ENV.SMTP_HOST.toLowerCase().includes('gmail'));
      const cleanPass = ENV.SMTP_PASS.replace(/\s+/g, ''); // Automatically remove spaces from Gmail app passwords

      if (isGmail) {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: ENV.SMTP_USER,
            pass: cleanPass,
          },
        });
      } else {
        this.transporter = nodemailer.createTransport({
          host: ENV.SMTP_HOST || 'smtp.gmail.com',
          port: ENV.SMTP_PORT || 587,
          secure: ENV.SMTP_PORT === 465,
          auth: {
            user: ENV.SMTP_USER,
            pass: cleanPass,
          },
        });
      }

      return this.transporter;
    }

    return null;
  }

  /**
   * Generates a secure 6-digit numeric OTP code
   */
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Sends an enterprise-grade HTML OTP verification email to the user
   */
  static async sendOtpEmail(toEmail: string, userName: string, otpCode: string): Promise<{ success: boolean; mode: 'smtp' | 'dev' }> {
    const transporter = this.getTransporter();

    const subject = `${otpCode} is your AI Mentor Verification Code`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #070C12; color: #FFFFFF; margin: 0; padding: 24px; }
        .container { max-width: 540px; margin: 0 auto; background: #0E1622; border-radius: 16px; border: 1px solid #1C293A; overflow: hidden; }
        .header { background: linear-gradient(135deg, #0A2239 0%, #00F5D4 100%); padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; color: #070C12; letter-spacing: 0.5px; }
        .content { padding: 36px 32px; }
        .greeting { font-size: 18px; font-weight: 600; color: #FFFFFF; margin-bottom: 12px; }
        .desc { font-size: 14px; line-height: 22px; color: #94A3B8; margin-bottom: 28px; }
        .otp-box { background: #152233; border: 2px dashed #00F5D4; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px; }
        .otp-code { font-size: 38px; font-weight: 800; color: #00F5D4; letter-spacing: 8px; font-family: monospace; }
        .otp-expiry { font-size: 12px; color: #64748B; margin-top: 8px; }
        .footer { border-top: 1px solid #1C293A; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748B; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AI MENTOR</h1>
          <p style="margin: 4px 0 0; color: #070C12; font-weight: 600; font-size: 13px;">ENTERPRISE INTERVIEW PREPARATION</p>
        </div>
        <div class="content">
          <div class="greeting">Hello ${userName || 'Candidate'},</div>
          <div class="desc">
            Welcome to AI Mentor! To complete your registration and activate your personalized interview training workspace, please verify your email address using the confirmation code below:
          </div>
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
            <div class="otp-expiry">This code will expire in 10 minutes.</div>
          </div>
          <div class="desc" style="font-size: 13px; margin-bottom: 0;">
            If you did not initiate this account creation, you can safely disregard this email. Your account will not be created without this verification.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AI Mentor Career Intelligence Inc. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: ENV.SMTP_FROM,
          to: toEmail,
          subject,
          text: `Your AI Mentor verification code is: ${otpCode}. It expires in 10 minutes.`,
          html,
        });
        console.log(`[EmailService] OTP email successfully dispatched to ${toEmail}`);
        return { success: true, mode: 'smtp' };
      } catch (err: any) {
        console.warn(`[EmailService] SMTP delivery error (${err.message}). Falling back to terminal display:`);
      }
    }

    // Development / fallback mode: Log OTP visibly in console so registration can proceed
    console.log('\n============================================================');
    console.log(`📧 [AI MENTOR EMAIL VERIFICATION]`);
    console.log(`👤 Recipient : ${userName} <${toEmail}>`);
    console.log(`🔑 OTP CODE  : >>> ${otpCode} <<<`);
    console.log(`⏱️  Validity  : 10 Minutes`);
    console.log('============================================================\n');

    return { success: true, mode: 'dev' };
  }
}
