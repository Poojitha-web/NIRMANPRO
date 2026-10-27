import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private logger = new Logger('MailService');
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (user && user !== 'not-configured@gmail.com' && pass && pass !== 'not-configured') {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mailer initialized for ${user}`);
    } else {
      this.logger.warn('SMTP credentials not configured. Email output will be logged to server console.');
    }
  }

  async sendOtpEmail(email: string, otp: string, username: string = 'User') {
    const subject = 'NIRMAN PRO - Login Verification Code';
    const textBody = `Hello ${username},\n\nYour NIRMAN PRO verification code is:\n\n${otp}\n\nThis OTP will expire in 5 minutes.\n\nIf you did not request this login, please ignore this email.\n\nRegards,\nNIRMAN PRO Team`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #334155; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #38bdf8; margin: 0; font-size: 26px; font-weight: 800; tracking-wide: 1px;">NIRMAN PRO</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Smart Construction Planning, Quantity Surveying & Cost Estimation Platform</p>
        </div>
        <p style="font-size: 15px; color: #f1f5f9;">Hello <strong>${username}</strong>,</p>
        <p style="font-size: 14px; color: #cbd5e1; margin-top: 12px;">Your NIRMAN PRO verification code is:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; background: #1e293b; padding: 14px 28px; border-radius: 10px; border: 1px solid #0284c7; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.15); display: inline-block;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">This OTP will expire in <strong>5 minutes</strong>.</p>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 16px;">If you did not request this login, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">Regards,<br><strong style="color: #f8fafc;">NIRMAN PRO Team</strong></p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"NIRMAN PRO" <${process.env.SMTP_USER}>`,
          to: email,
          subject,
          text: textBody,
          html: htmlBody,
        });
        this.logger.log(`OTP Email sent successfully to ${email}`);
      } catch (err: any) {
        this.logger.error(`Failed to send OTP email to ${email}: ${err.message}`);
      }
    } else {
      this.logger.log(`\n================ NIRMAN PRO OTP EMAIL ================`);
      this.logger.log(`To: ${email}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`\n${textBody}`);
      this.logger.log(`======================================================\n`);
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, username: string = 'User') {
    const subject = 'NIRMAN PRO - Password Reset Request';
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    const textBody = `Hello ${username},\n\nYou requested a password reset for your NIRMAN PRO account.\n\nPlease use the following link to reset your password:\n${resetUrl}\n\nThis token will expire in 15 minutes.\n\nIf you did not request a password reset, please ignore this email.\n\nRegards,\nNIRMAN PRO Team`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #334155; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #38bdf8; margin: 0; font-size: 26px; font-weight: 800;">NIRMAN PRO</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Smart Construction Planning, Quantity Surveying & Cost Estimation Platform</p>
        </div>
        <p style="font-size: 15px; color: #f1f5f9;">Hello <strong>${username}</strong>,</p>
        <p style="font-size: 14px; color: #cbd5e1;">You requested a password reset for your NIRMAN PRO account.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">This link will expire in <strong>15 minutes</strong>.</p>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">Regards,<br><strong style="color: #f8fafc;">NIRMAN PRO Team</strong></p>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: `"NIRMAN PRO" <${process.env.SMTP_USER}>`,
          to: email,
          subject,
          text: textBody,
          html: htmlBody,
        });
        this.logger.log(`Password reset email sent to ${email}`);
      } catch (err: any) {
        this.logger.error(`Failed to send reset email to ${email}: ${err.message}`);
      }
    } else {
      this.logger.log(`\n================ NIRMAN PRO RESET EMAIL ================`);
      this.logger.log(`To: ${email}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Reset URL: ${resetUrl}`);
      this.logger.log(`========================================================\n`);
    }
  }
}
