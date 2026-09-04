import { Router, Request, Response } from "express";
import crypto from "crypto";
import { bindUser } from "../services/ldap.service";
import { env } from "../config/env";
import { sendPasswordResetEmail } from "../services/email.service";
import {
  RegistrationInput,
  findUserByEmail,
  findUserByIdentifier,
  getUserLanguage,
  isUsernameTaken,
  registerUserInDefaultGroup,
  resetPasswordWithToken,
  storePasswordResetToken,
  updateLastLogin,
  isUserActive,
} from "../services/user.service";
import { query } from "../services/db";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

const toMySqlDateTime = (date: Date): string => {
  return date.toISOString().slice(0, 19).replace("T", " ");
};

const isSecureRequest = (req: Request): boolean => {
  return req.secure || req.headers["x-forwarded-proto"] === "https";
};

// The web clients live on a different site than this API (e.g. http://<ip>:8081
// or the Next.js app vs api.lenez.dev). SameSite=Strict cookies are never sent
// on cross-site requests, so use SameSite=None; Secure for HTTPS traffic and
// fall back to Lax for plain-HTTP local development.
const sessionCookieOptions = (req: Request, expires?: Date) => ({
  httpOnly: true,
  ...(isSecureRequest(req)
    ? { sameSite: "none" as const, secure: true }
    : { sameSite: "lax" as const, secure: false }),
  ...(expires ? { expires } : {}),
});

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

    // Verify the user is active in the database (active = 1)
    const active = await isUserActive(user);
    if (!active) {
      return res.status(403).json({ success: false, error: "Account is inactive or removed" });
    }

    await bindUser(user.ldapUid, password);
    await updateLastLogin(user);

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await query(
      "INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
      [sessionToken, user.userId, toMySqlDateTime(expiresAt)]
    );

    res.cookie("cubcha_session", sessionToken, sessionCookieOptions(req, expiresAt));

    const userLang = await getUserLanguage(user.userId);
    res.json({ success: true, message: "Login successful", user: { username: user.username, user_language: userLang }, token: sessionToken });
  } catch (error) {
    // If we reached bindUser, username is valid, so error must be password
    res.status(401).json({ success: false, error: "Invalid password" });
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
    res.json({ success: true, message: "Account created successfully" });
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
      let userLang = "en";
      const rawUid = user.uid;
      const ldapUid: string | undefined = Array.isArray(rawUid) ? (rawUid[0] as string) : (rawUid as string | undefined);
      if (ldapUid) {
        const dbRecord = await findUserByIdentifier(ldapUid);
        if (dbRecord) userLang = await getUserLanguage(dbRecord.userId);
      }
      const resetUrl = buildResetUrl(token, userLang);
      await sendPasswordResetEmail(upperEmail, resetUrl);
      if (env.app.exposeResetUrl) {
        res.json({
          success: true,
          resetUrl,
        });
        return;
      }
    }
    res.json({
      success: true,
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

router.get("/me", authMiddleware, (req: Request, res: Response) => {
  res.json({ success: true, username: req.user.username });
});

router.post("/logout", authMiddleware, async (req: Request, res: Response) => {
  let token = req.cookies?.cubcha_session as string | undefined;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }
  if (token) {
    try {
      await query("DELETE FROM user_sessions WHERE token = ?", [token]);
    } catch {
      // Proceed with logout even if DB delete fails
    }
  }
  res.clearCookie("cubcha_session", sessionCookieOptions(req));
  res.json({ success: true });
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

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, "");

const buildResetUrl = (token: string, lang = "en"): string => {
  const baseFromEnv = env.app.resetPasswordBaseUrl;
  const fallback = env.app.clientOrigins[0] ?? "";
  const base = normalizeBaseUrl(baseFromEnv || fallback);
  const path = "/";
  const query = `token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
  return base ? `${base}${path}?${query}` : `${path}?${query}`;
};

export default router;
