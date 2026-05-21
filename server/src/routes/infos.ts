import { Router, Request, Response } from "express";
import { query } from "../services/db";

const router = Router();

// GET /infos?category=...&language_code=...
router.get("/", async (req: Request, res: Response) => {
  const { category, language_code } = req.query;
  if (!category || !language_code) {
    res.status(400).json({ success: false, error: "category and language_code are required" });
    return;
  }

  const allowedCategories = ["update", "manual", "announcement", "reported_bugs"];
  const allowedLanguages = ["en", "sk", "es", "fr", "de", "cz"];

  if (!allowedCategories.includes(category as string)) {
    res.status(400).json({ success: false, error: "Invalid category" });
    return;
  }
  if (!allowedLanguages.includes(language_code as string)) {
    res.status(400).json({ success: false, error: "Invalid language_code" });
    return;
  }

  try {
    const rows = await query<{
      info_id: number;
      heading_cube: string;
      text_description: string;
      display_order: number;
    }>(
      `SELECT info_id, heading_cube, text_description, display_order
       FROM cubcha_v1.infos
       WHERE category = ? AND language_code = ?
       ORDER BY display_order ASC`,
      [category as string, language_code as string]
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /infos/reported-bugs — show all user-submitted bug reports
router.get("/reported-bugs", async (_req: Request, res: Response) => {
  try {
    const rows = await query<{
      bug_id: number;
      title: string;
      bug_description: string;
      created_at: string;
      display_name: string;
    }>(
      `SELECT rb.bug_id, rb.title, rb.bug_description, rb.created_at, u.display_name
       FROM cubcha_v1.report_bug rb
       JOIN cubcha_v1.user_main_details u ON u.user_id = rb.user_id
       ORDER BY rb.created_at DESC
       LIMIT 100`,
      []
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// POST /infos/report-bug — submit a bug report
router.post("/report-bug", async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { title, description } = req.body as { title?: string; description?: string };

  if (!title || title.trim().length === 0) {
    res.status(400).json({ success: false, error: "title is required" });
    return;
  }
  if (title.trim().length > 64) {
    res.status(400).json({ success: false, error: "title exceeds 64 characters" });
    return;
  }
  if (!description || description.trim().length === 0) {
    res.status(400).json({ success: false, error: "description is required" });
    return;
  }
  if (description.trim().length > 256) {
    res.status(400).json({ success: false, error: "description exceeds 256 characters" });
    return;
  }

  try {
    await query(
      "INSERT INTO cubcha_v1.report_bug (user_id, title, bug_description) VALUES (?, ?, ?)",
      [userId, title.trim(), description.trim()]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
