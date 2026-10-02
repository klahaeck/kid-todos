import nodemailer from "nodemailer";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { sendHouseholdInviteEmail } from "@/lib/email/household-invite";
import { sendSmtpEmail } from "@/lib/email/smtp";

beforeEach(() => {
  vi.stubEnv("SMTP_HOST", "smtp.example.com");
  vi.stubEnv("EMAIL_FROM", "StarrySteps <hello@example.com>");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://starrysteps.com");
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

test("patched Nodemailer generates the invite's recipient, subject, and acceptance link", async () => {
  // Exercise the installed mail composer without sending a message or opening a socket.
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const send = vi.spyOn(transport, "sendMail");
  vi.spyOn(nodemailer, "createTransport").mockReturnValue(transport);
  await expect(sendHouseholdInviteEmail({ toEmail: "parent@example.com", token: "token/with spaces" })).resolves.toEqual({ ok: true });
  const message = await send.mock.results[0].value as { envelope: { to: string[] }; message: Buffer };
  expect(message.envelope.to).toEqual(["parent@example.com"]);
  expect(message.message.toString()).toContain("Subject:");
  const decodedBody = message.message.toString().replace(/=\r\n/g, "").replace(/=3D/g, "=");
  expect(decodedBody).toContain("https://starrysteps.com/household/join?token=token%2Fwith%20spaces");
});

test("transport failures are returned to the invitation action", async () => {
  const transport = nodemailer.createTransport({ streamTransport: true });
  vi.spyOn(transport, "sendMail").mockRejectedValue(new Error("SMTP unavailable"));
  vi.spyOn(nodemailer, "createTransport").mockReturnValue(transport);
  await expect(sendSmtpEmail({ to: "parent@example.com", subject: "Invite", html: "<p>Invite</p>" })).resolves.toEqual({ ok: false, error: "SMTP unavailable" });
});
