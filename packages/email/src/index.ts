import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface EmailConfig {
  provider: 'sendgrid' | 'smtp';
  apiKey?: string;
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  from: {
    email: string;
    name: string;
  };
}

export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export class EmailService {
  private config: EmailConfig;
  private transporter?: nodemailer.Transporter;

  constructor(config: EmailConfig) {
    this.config = config;
    
    if (config.provider === 'sendgrid' && config.apiKey) {
      sgMail.setApiKey(config.apiKey);
    } else if (config.provider === 'smtp' && config.smtp) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
    }
  }

  async send(emailData: EmailData): Promise<void> {
    const html = this.renderTemplate(emailData.template, emailData.data);
    
    const mailOptions = {
      from: `${this.config.from.name} <${this.config.from.email}>`,
      to: emailData.to,
      subject: emailData.subject,
      html,
    };

    if (this.config.provider === 'sendgrid') {
      await sgMail.send(mailOptions);
    } else if (this.transporter) {
      await this.transporter.sendMail(mailOptions);
    } else {
      throw new Error('Email service not configured');
    }
  }

  private renderTemplate(templateName: string, data: Record<string, any>): string {
    const templatePath = join(__dirname, '../templates', `${templateName}.hbs`);
    const templateSource = readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);
    return template(data);
  }

  async sendWelcome(data: { to: string; username: string; verificationLink?: string }): Promise<void> {
    await this.send({
      to: data.to,
      subject: 'Welcome to The Chatroom! 🎉',
      template: 'welcome',
      data,
    });
  }

  async sendPasswordReset(data: { to: string; resetLink: string }): Promise<void> {
    await this.send({
      to: data.to,
      subject: 'Password Reset Request',
      template: 'password-reset',
      data,
    });
  }

  async sendVerificationApproved(data: { to: string; username: string }): Promise<void> {
    await this.send({
      to: data.to,
      subject: 'Your verification has been approved! ✅',
      template: 'verification-approved',
      data,
    });
  }
}

export default EmailService;
