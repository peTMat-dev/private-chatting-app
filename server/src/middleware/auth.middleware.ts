import { Request, Response, NextFunction } from "express";
import { query } from "../services/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: { userId: number; username: string };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token = req.cookies?.cubcha_session as string | undefined;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }
  if (!token) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  try {
    const rows = await query<{ user_id: number; ldap_uid_id: string }>(
      `SELECT us.user_id, umd.ldap_uid_id
       FROM user_sessions us
       JOIN user_main_details umd ON umd.user_id = us.user_id
       WHERE us.token = ? AND us.expires_at > NOW()
       LIMIT 1`,
      [token]
    );

    if (rows.length === 0) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    req.user = { userId: rows[0].user_id, username: rows[0].ldap_uid_id };
    next();
  } catch {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
