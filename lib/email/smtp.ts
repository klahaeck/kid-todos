import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

function smtpFromEnv(): {
  transport: Transporter;
  from: string;
} | null {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!host || !from) return null;

  const portRaw = process.env.SMTP_PORT?.trim();
  const parsed = portRaw ? Number.parseInt(portRaw, 10) : 587;
  const port = Number.isFinite(parsed) ? parsed : 587;

  const secureEnv = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure =
    secureEnv === "true" ||
    secureEnv === "1" ||
    (!secureEnv && port === 465);

  const user = process.env.SMTP_USER?.trim();
  const pass =
    process.env.SMTP_PASSWORD?.trim() ?? process.env.SMTP_PASS?.trim();

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return { transport, from };
}

export function smtpConfigurationError(): string {
  return "Email is not configured. Set SMTP_HOST, EMAIL_FROM, and (if your server requires auth) SMTP_USER plus SMTP_PASSWORD or SMTP_PASS. Optional: SMTP_PORT (default 587), SMTP_SECURE (true for implicit TLS, e.g. port 465).";
}

export async function sendSmtpEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const cfg = smtpFromEnv();
  if (!cfg) {
    return { ok: false, error: smtpConfigurationError() };
  }

  try {
    await cfg.transport.sendMail({
      from: cfg.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to send email.";
    return { ok: false, error: message };
  }
}
