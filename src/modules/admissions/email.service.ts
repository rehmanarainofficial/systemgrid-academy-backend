import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class AdmissionEmailService {
  private readonly logger = new Logger(AdmissionEmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmailVerificationOtp(email: string, otp: string) {
    await this.send({
      to: email,
      subject: 'Verify your SystemGrid Academy admission email',
      text: `Your SystemGrid Academy verification code is ${otp}. This code will expire in 15 minutes.`,
      html: this.otpTemplate(otp),
    });
  }

  async sendPaymentLinkEmail(email: string, courseTitle: string, finalPayable: number, paymentLink: string) {
    await this.send({
      to: email,
      subject: 'Complete your SystemGrid Academy admission payment',
      text: [
        'Your admission application is ready for payment.',
        `Course: ${courseTitle}`,
        `Final payable: PKR ${finalPayable.toLocaleString('en-PK')}`,
        `Payment link: ${paymentLink}`,
      ].join('\n'),
    });
  }

  async sendWelcomeEmail(email: string) {
    await this.send({
      to: email,
      subject: 'Welcome to SystemGrid Academy',
      text: 'Your payment has been verified and your student account is active. Please use the password reset flow to set your portal password securely.',
    });
  }

  async sendReferralRewardEmail(email: string) {
    await this.send({
      to: email,
      subject: 'Referral reward added to your wallet',
      text: 'Your referral was verified. PKR 1,000 credit has been added to your SystemGrid Academy wallet.',
    });
  }

  private async send(payload: MailPayload) {
    const host = this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    if (!host || !user || !pass) {
      this.logger.log(`[mail:dev] ${payload.subject} -> ${payload.to}: ${payload.text}`);
      return;
    }

    try {
      const optionalImport = new Function('moduleName', 'return import(moduleName)') as (moduleName: string) => Promise<any>;
      const nodemailer = await optionalImport('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port: Number(this.configService.get<string>('MAIL_PORT') ?? 587),
        secure: String(this.configService.get<string>('MAIL_SECURE') ?? 'false') === 'true',
        auth: { user, pass },
      });
      await transporter.sendMail({
        from: `"${this.configService.get<string>('MAIL_FROM_NAME') ?? 'SystemGrid Academy'}" <${this.configService.get<string>('MAIL_FROM_EMAIL') ?? user}>`,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
    } catch (error) {
      this.logger.warn(`Email delivery skipped: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  private otpTemplate(otp: string) {
    return `
      <div style="margin:0;padding:0;background:#f4f7fb;font-family:Inter,Arial,sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;overflow:hidden;border-radius:28px;background:#ffffff;box-shadow:0 24px 80px rgba(15,23,42,.12);">
                <tr>
                  <td style="padding:28px 28px 18px;background:linear-gradient(135deg,#0071e3,#00b8ff 55%,#6d5dfc);color:#ffffff;">
                    <div style="display:inline-block;border-radius:999px;background:rgba(255,255,255,.16);padding:7px 12px;font-size:12px;font-weight:700;letter-spacing:.04em;">SYSTEMGRID ACADEMY</div>
                    <h1 style="margin:18px 0 0;font-size:28px;line-height:1.15;letter-spacing:-.03em;">Verify your admission email</h1>
                    <p style="margin:10px 0 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,.86);">Use this secure code to continue your online admission application.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 28px;">
                    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#4b5563;">Your six-digit verification code is:</p>
                    <div style="border-radius:22px;border:1px solid #dbeafe;background:#eff6ff;padding:22px;text-align:center;">
                      <div style="font-size:38px;line-height:1;font-weight:800;letter-spacing:.32em;color:#0071e3;">${otp}</div>
                    </div>
                    <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#6b7280;">This code expires in 15 minutes. If you did not request admission at SystemGrid Academy, you can safely ignore this email.</p>
                    <div style="margin-top:24px;border-radius:18px;background:#f8fafc;padding:16px;font-size:13px;line-height:1.7;color:#475569;">
                      For your security, SystemGrid Academy will never ask for this code through WhatsApp or phone call.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `;
  }
}
