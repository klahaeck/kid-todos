import { sendSmtpEmail } from "@/lib/email/smtp";

function appBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  const v = process.env.VERCEL_URL?.trim();
  if (v) return `https://${v.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export async function sendHouseholdInviteEmail(params: {
  toEmail: string;
  token: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = appBaseUrl();
  const url = `${base}/household/join?token=${encodeURIComponent(params.token)}`;
  const html = `<p>You’ve been invited to join a household on StarrySteps so you can share the same dashboard and routines.</p>
<p><a href="${url}">Accept invite</a></p>
<p>If the link doesn’t work, copy and paste this URL into your browser:</p>
<p style="word-break:break-all">${url}</p>`;
  const text = `You've been invited to join a household on StarrySteps.\n\nAccept invite: ${url}`;

  return sendSmtpEmail({
    to: params.toEmail,
    subject: "You’re invited to collaborate on StarrySteps",
    html,
    text,
  });
}
