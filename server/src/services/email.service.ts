import nodemailer from "nodemailer";
import { env } from "../config/env";

export const sendPasswordResetEmail = async (to: string, webResetUrl: string, appResetUrl: string | null = null): Promise<void> => {
  if (!env.mail.enabled) {
    return;
  }

  if (!env.mail.host || !env.mail.from) {
    throw new Error("SMTP is enabled but MAIL_HOST or MAIL_FROM is missing");
  }

  const transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: env.mail.user
      ? {
          user: env.mail.user,
          pass: env.mail.pass,
        }
      : undefined,
  });

  const subject = "Reset your Cubcha password";

  const text = appResetUrl
    ? `We received a request to reset your password.\n\nTap the link below to reset it. It will open the Cubcha app on your device:\n\n${appResetUrl}\n\nIf the link above doesn't work, paste this URL into your browser:\n${webResetUrl}\n\nIf you did not request this, you can ignore this email. Your password will not be changed.`
    : `We received a request to reset your password.\n\nReset link: ${webResetUrl}\n\nIf you did not request this, you can ignore this email. Your password will not be changed.`;

  const html = appResetUrl
    ? `
    <p>We received a request to reset your password.</p>
    <p><a href="${appResetUrl}">Reset your password</a></p>
    <p style="font-size: 13px; color: #888;">If the button doesn't work, copy and paste this link into your browser:<br><a href="${webResetUrl}">${webResetUrl}</a></p>
    <p style="font-size: 12px; color: #999;">If you did not request this, you can ignore this email. Your password will not be changed.</p>
  `
    : `
    <p>We received a request to reset your password.</p>
    <p><a href="${webResetUrl}">Reset your password</a></p>
    <p style="font-size: 12px; color: #999;">If you did not request this, you can ignore this email. Your password will not be changed.</p>
  `;

  await transporter.sendMail({
    from: env.mail.from,
    to,
    subject,
    text,
    html,
  });
};
