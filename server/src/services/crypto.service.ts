import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "../config/env";

const KEY = Buffer.from(env.encryption.key, "hex"); // 32 bytes

export function encryptText(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptText(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    // Return as-is if the value is not in the expected encrypted format (e.g. legacy plaintext)
    return ciphertext;
  }
  const [ivB64, authTagB64, encryptedB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
