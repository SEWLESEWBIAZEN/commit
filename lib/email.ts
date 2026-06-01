// Email delivery via SMTP (e.g. Gmail) using nodemailer. Server-only.
//
// Env:
//   EMAIL_HOST     — SMTP host, e.g. "smtp.gmail.com"
//   EMAIL_PORT     — SMTP port, e.g. 465 (SSL) or 587 (STARTTLS)
//   EMAIL_USER     — SMTP username (the full Gmail address)
//   EMAIL_PASSWORD — SMTP password (a Gmail App Password, not the account password)
//   EMAIL_FROM     — From header, e.g. "Commit <you@gmail.com>" (defaults to EMAIL_USER)

import nodemailer, { type Transporter } from 'nodemailer';

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendResult {
  ok: boolean;
  skipped?: boolean; // not configured — treated as a no-op, not an error
  error?: string;
}

export function emailConfigured(): boolean {
  return (
    !!process.env.EMAIL_HOST &&
    !!process.env.EMAIL_USER &&
    !!process.env.EMAIL_PASSWORD
  );
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const port = Number(process.env.EMAIL_PORT ?? 465);
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  return transporter;
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs): Promise<SendResult> {
  if (!emailConfigured()) {
    console.warn('[email] EMAIL_HOST / EMAIL_USER / EMAIL_PASSWORD not set — skipping send to', to);
    return { ok: false, skipped: true };
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      ...(text ? { text } : {}),
    });
    return { ok: true };
  } catch (e) {
    console.error('[email] send failed', e);
    return { ok: false, error: (e as Error).message };
  }
}
