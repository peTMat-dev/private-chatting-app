import { Router, Request, Response } from "express";
import crypto from "crypto";
import { bindUser } from "../services/ldap.service";
import { env } from "../config/env";
import { sendPasswordResetEmail } from "../services/email.service";
import {
  RegistrationInput,
  findUserByEmail,
  findUserByIdentifier,
  isUsernameTaken,
  registerUserInDefaultGroup,
  resetPasswordWithToken,
  storePasswordResetToken,
  updateLastLogin,
} from "../services/user.service";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password are required" });
  }

  try {
    const user = await findUserByIdentifier(username);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    await bindUser(user.ldapUid, password);
    await updateLastLogin(user);

    res.json({ success: true, message: "Login successful", user: { username: user.username } });
  } catch (error) {
    res.status(401).json({ success: false, error: (error as Error).message ?? "Login failed" });
  }
});

router.post("/register", async (req: Request, res: Response) => {
  const payload = normalizeRegistrationInput(req.body as Partial<RegistrationInput>);
  const errors = validateRegistrationPayload(payload);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    // Check username and email conflicts in parallel to report all at once.
    const [usernameTaken, emailOwner] = await Promise.all([
      isUsernameTaken(payload.username),
      findUserByEmail(payload.email),
    ]);

    const conflictErrors: string[] = [];
    if (usernameTaken) conflictErrors.push("Username already exists");
    if (emailOwner) conflictErrors.push("Email already registered");
    if (conflictErrors.length > 0) {
      return res.status(409).json({ success: false, errors: conflictErrors });
    }

    await registerUserInDefaultGroup(payload);
    res.json({ success: true, message: "Account created and linked to chat_groups" });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }

  const upperEmail = email.trim();
  try {
    const user = await findUserByEmail(upperEmail);
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await storePasswordResetToken(upperEmail, token, toMySqlDateTime(expiresAt));
      const resetUrl = buildResetUrl(token);
      await sendPasswordResetEmail(upperEmail, resetUrl);
      if (env.app.exposeResetUrl) {
        res.json({
          success: true,
          message: "If the email exists, reset instructions have been queued.",
          resetUrl,
        });
        return;
      }
    }
    res.json({
      success: true,
      message: "If the email exists, reset instructions have been queued.",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
  const { token, password } = req.body as { token?: string; password?: string };

  if (!token || !token.trim()) {
    return res.status(400).json({ success: false, errors: ["Reset token is required"] });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, errors: ["Password must be at least 6 characters long"] });
  }

  const trimmedToken = token.trim();

  try {
    await resetPasswordWithToken(trimmedToken, password);
    res.json({ success: true, message: "Password has been reset. Please sign in." });
  } catch (error) {
    const message = (error as Error).message || "Unable to reset password";
    const status = /invalid|expired/i.test(message) ? 400 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

const normalizeRegistrationInput = (input: Partial<RegistrationInput>): RegistrationInput => ({
  firstName: (input.firstName ?? "").trim(),
  lastName: (input.lastName ?? "").trim(),
  displayName: (input.displayName ?? "").trim(),
  username: (input.username ?? "").trim(),
  email: (input.email ?? "").trim(),
  password: input.password ?? "",
});

const validateRegistrationPayload = (payload: RegistrationInput): string[] => {
  const errors: string[] = [];
  if (!payload.firstName) errors.push("First name is required");
  if (!payload.lastName) errors.push("Last name is required");
  if (!payload.displayName) errors.push("Display name is required");
  if (payload.displayName && payload.displayName.length < 3)
    errors.push("Display name must be at least 3 characters");
  if (payload.displayName.length > 64) errors.push("Display name must be under 65 characters");
  if (!payload.username) errors.push("Username is required");
  if (payload.username.length < 3) errors.push("Username must be at least 3 characters");
  if (!payload.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
    errors.push("Valid email is required");
  }
  if (!payload.password || payload.password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }
  return errors;
};

const toMySqlDateTime = (date: Date): string => {
  return date.toISOString().slice(0, 19).replace("T", " ");
};

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, "");

const buildResetUrl = (token: string): string => {
  const baseFromEnv = env.app.resetPasswordBaseUrl;
  const fallback = env.app.clientOrigins[0] ?? "";
  const base = normalizeBaseUrl(baseFromEnv || fallback);
  const path = "/reset-password";
  const query = `token=${encodeURIComponent(token)}`;
  return base ? `${base}${path}?${query}` : `${path}?${query}`;
};

export default router;
