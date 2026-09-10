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
    ? `We received a request to reset your password.\n\nReset in the app: ${appResetUrl}\n\nOr reset on the web: ${webResetUrl}\n\nIf you did not request this, you can ignore this email.`
    : `We received a request to reset your password.\n\nReset link: ${webResetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = appResetUrl
    ? `
    <p>We received a request to reset your password.</p>
    <p><a href="${appResetUrl}">Reset your password in the app</a></p>
    <p>Or <a href="${webResetUrl}">reset your password on the web</a>.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `
    : `
    <p>We received a request to reset your password.</p>
    <p><a href="${webResetUrl}">Reset your password</a></p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  await transporter.sendMail({
    from: env.mail.from,
    to,
    subject,
    text,
    html,
  });
};
