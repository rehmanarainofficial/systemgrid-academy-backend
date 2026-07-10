import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
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

  private frontendUrl(path = '') {
    const base = (this.configService.get<string>('FRONTEND_URL') ?? 'https://academy.thesystemgrid.com').replace(/\/$/, '');
    if (!path) return base;
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async sendEmailVerificationOtp(email: string, otp: string) {
    await this.send({
      to: email,
      subject: 'Verify your SystemGrid Academy admission email',
      text: `Your SystemGrid Academy verification code is ${otp}. This code will expire in 15 minutes.`,
      html: this.otpTemplate(otp),
    });
  }

  async sendPaymentLinkEmail(
    email: string,
    courseTitle: string,
    finalPayable: number,
    paymentLink: string,
  ) {
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

  async sendWelcomeEmail(email: string, name: string, password: string) {
    await this.send({
      to: email,
      subject: 'Welcome to SystemGrid Academy - Your Account is Ready',
      text: [
        `Dear ${name},`,
        '',
        'Congratulations! Your payment has been verified and your student account is now active.',
        '',
        'Here are your login credentials:',
        `Email: ${email}`,
        `Password: ${password}`,
        '',
        `Login URL: ${this.frontendUrl('/login')}`,
        '',
        'For your security, we recommend changing your password after your first login.',
        '',
        'If you have any questions, please contact our support team.',
        '',
        'Welcome to SystemGrid Academy!',
      ].join('\n'),
      html: this.welcomeTemplate(name, email, password),
    });
  }

  async sendReferralRewardEmail(
    email: string,
    amount: number,
    referrerName = 'Student',
  ) {
    const formattedAmount = Number(amount).toLocaleString('en-PK');
    const text = `Your referral was verified. PKR ${formattedAmount} credit has been added to your SystemGrid Academy wallet.`;
    await this.send({
      to: email,
      subject: 'Referral reward added to your wallet',
      text,
      html: this.referralRewardTemplate(referrerName, formattedAmount),
    });
  }

  private async send(payload: MailPayload) {
    const host = this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    if (!host || !user || !pass) {
      if (process.env.NODE_ENV === 'production') {
        this.logger.error(
          `Email not configured. Missing MAIL_HOST, MAIL_USER, or MAIL_PASS.`,
        );
        throw new ServiceUnavailableException(
          'Email service is not configured on the server.',
        );
      }
      this.logger.log(
        `[mail:dev] ${payload.subject} -> ${payload.to}: ${payload.text}`,
      );
      return;
    }

    try {
      const optionalImport = new Function(
        'moduleName',
        'return import(moduleName)',
      ) as (moduleName: string) => Promise<any>;
      const nodemailer = await optionalImport('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port: Number(this.configService.get<string>('MAIL_PORT') ?? 587),
        secure:
          String(this.configService.get<string>('MAIL_SECURE') ?? 'false') ===
          'true',
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
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`Email delivery failed: ${message}`);
      throw new ServiceUnavailableException(
        'Unable to send email right now. Please try again shortly.',
      );
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

  private welcomeTemplate(name: string, email: string, password: string) {
    return `
      <div style="margin:0;padding:0;background:#f4f7fb;font-family:Inter,Arial,sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;overflow:hidden;border-radius:28px;background:#ffffff;box-shadow:0 24px 80px rgba(15,23,42,.12);">
                <tr>
                  <td style="padding:28px 28px 18px;background:linear-gradient(135deg,#0071e3,#00b8ff 55%,#6d5dfc);color:#ffffff;">
                    <div style="display:inline-block;border-radius:999px;background:rgba(255,255,255,.16);padding:7px 12px;font-size:12px;font-weight:700;letter-spacing:.04em;">SYSTEMGRID ACADEMY</div>
                    <h1 style="margin:18px 0 0;font-size:28px;line-height:1.15;letter-spacing:-.03em;">Welcome to SystemGrid Academy!</h1>
                    <p style="margin:10px 0 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,.86);">Your student account is now active and ready to use.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 28px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#4b5563;">Dear ${name},</p>
                    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#4b5563;">Congratulations! Your payment has been verified and your student account is now active. Here are your login credentials:</p>
                    
                    <div style="margin:20px 0;border-radius:22px;border:1px solid #dbeafe;background:#eff6ff;padding:20px;">
                      <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#6b7280;font-weight:600;">EMAIL ADDRESS</p>
                      <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#0071e3;font-weight:700;">${email}</p>
                      
                      <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#6b7280;font-weight:600;">PASSWORD</p>
                      <p style="margin:0 0 8px;font-size:20px;line-height:1;font-weight:800;letter-spacing:.16em;color:#0071e3;">${password}</p>
                    </div>
                    
                    <div style="margin:24px 0;padding:16px;border-radius:18px;background:#f8fafc;">
                      <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#475569;font-weight:600;">HOW TO LOGIN</p>
                      <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:#4b5563;">
                        <li style="margin-bottom:8px;">Visit <a href="${this.frontendUrl('/login')}" style="color:#0071e3;text-decoration:underline;">${this.frontendUrl('/login').replace(/^https?:\/\//, '')}</a></li>
                        <li style="margin-bottom:8px;">Enter your email address and password above</li>
                        <li style="margin-bottom:8px;">Click "Login" to access your student portal</li>
                        <li>For your security, we recommend changing your password after first login</li>
                      </ol>
                    </div>
                    
                    <p style="margin:24px 0 8px;font-size:14px;line-height:1.7;color:#4b5563;">If you have any questions or need assistance, please contact our support team.</p>
                    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#4b5563;">Welcome to SystemGrid Academy! We're excited to have you as part of our learning community.</p>
                    
                    <div style="margin-top:24px;border-radius:18px;background:#f8fafc;padding:16px;font-size:13px;line-height:1.7;color:#475569;">
                      <p style="margin:0;">For your security, never share your password with anyone. SystemGrid Academy will never ask for your password through email, WhatsApp, or phone call.</p>
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

  private referralRewardTemplate(name: string, formattedAmount: string) {
    const walletUrl = this.frontendUrl('/student/wallet');
    return `
      <div style="margin:0;padding:0;background:#f4f7fb;font-family:Inter,Arial,sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;overflow:hidden;border-radius:28px;background:#ffffff;box-shadow:0 24px 80px rgba(15,23,42,.12);">
                <tr>
                  <td style="padding:28px 28px 18px;background:linear-gradient(135deg,#0071e3,#00b8ff 55%,#6d5dfc);color:#ffffff;">
                    <div style="display:inline-block;border-radius:999px;background:rgba(255,255,255,.16);padding:7px 12px;font-size:12px;font-weight:700;letter-spacing:.04em;">SYSTEMGRID ACADEMY</div>
                    <h1 style="margin:18px 0 0;font-size:28px;line-height:1.15;letter-spacing:-.03em;">Referral reward added</h1>
                    <p style="margin:10px 0 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,.86);">Your referral was verified and wallet credit is now available.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 28px;">
                    <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#4b5563;">Dear ${name},</p>
                    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#4b5563;">Great news! Your referral was verified and the reward has been added to your SystemGrid Academy wallet.</p>
                    <div style="margin:20px 0;border-radius:22px;border:1px solid #dbeafe;background:#eff6ff;padding:22px;text-align:center;">
                      <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#6b7280;font-weight:600;">WALLET CREDIT ADDED</p>
                      <p style="margin:0;font-size:34px;line-height:1;font-weight:800;color:#0071e3;">PKR ${formattedAmount}</p>
                    </div>
                    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#4b5563;">You can use this balance toward your next fee installment from the student portal.</p>
                    <div style="margin:24px 0;text-align:center;">
                      <a href="${walletUrl}" style="display:inline-block;border-radius:999px;background:#0071e3;color:#ffffff;text-decoration:none;padding:14px 24px;font-size:14px;font-weight:700;">View Wallet</a>
                    </div>
                    <div style="margin-top:24px;border-radius:18px;background:#f8fafc;padding:16px;font-size:13px;line-height:1.7;color:#475569;">
                      Thank you for helping grow the SystemGrid Academy community. Keep sharing your referral code with friends who want to learn tech skills.
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
