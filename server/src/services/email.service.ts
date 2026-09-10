import nodemailer from "nodemailer";
import { env } from "../config/env";

export const sendPasswordResetEmail = async (to: string, resetUrl: string, source: "app" | "web" = "web"): Promise<void> => {
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

  const text = `We received a request to reset your password.\n\nReset link:\n${resetUrl}\n\nIf you did not request this, you can ignore this email. Your password will not be changed.`;

  const html = `
    <p>We received a request to reset your password.</p>
    <p>Reset link:<br><a href="${resetUrl}">${resetUrl}</a></p>
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
