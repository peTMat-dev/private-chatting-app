import { Router, Request, Response, NextFunction } from "express";
import { query } from "../services/db";
import { authMiddleware } from "../middleware/auth.middleware";

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
    const resultSets = await query("CALL infos_entries()", []);
    const allRows = resultSets[0] as {
      heading_cube: string;
      category: string;
      language_code: string;
      text_description: string;
      created_at: string;
    }[];

    const filtered = allRows.filter(
      (r) => r.category === (category as string) && r.language_code === (language_code as string)
    );

    if (category === "manual") {
      const grouped: Record<string, { heading_cube: string; descriptions: string[] }> = {};
      for (const row of filtered) {
        if (!grouped[row.heading_cube]) {
          grouped[row.heading_cube] = { heading_cube: row.heading_cube, descriptions: [] };
        }
        grouped[row.heading_cube].descriptions.push(row.text_description);
      }
      const data = Object.values(grouped);
      res.json({ success: true, count: data.length, data });
    } else {
      res.json({ success: true, count: filtered.length, data: filtered });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET /infos/reported-bugs — show all user-submitted bug reports
router.get("/reported-bugs", async (_req: Request, res: Response) => {
  try {
    const resultSets = await query("CALL infos_reported_bugs_list()", []);
    const rows = resultSets[0] as {
      bug_id: number;
      title: string;
      category: string;
      bug_description: string;
      created_at: string;
      display_name: string;
    }[];
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// POST /infos/report-bug — submit a bug report (requires authentication)
router.post("/report-bug", authMiddleware as (req: Request, res: Response, next: NextFunction) => void, async (req: Request, res: Response) => {
  const userId = req.user.userId;
  const { title, description, category } = req.body as { title?: string; description?: string; category?: string };

  const allowedBugCategories = ["UI", "Functionality", "Performance", "Security", "Other"];

  if (!title || title.trim().length === 0) {
    res.status(400).json({ success: false, error: "title is required" });
    return;
  }
  if (title.trim().length > 64) {
    res.status(400).json({ success: false, error: "title exceeds 64 characters" });
    return;
  }
  if (!category || !allowedBugCategories.includes(category)) {
    res.status(400).json({ success: false, error: "valid category is required" });
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
    await query("CALL infos_submit_bug(?, ?, ?, ?)", [userId, title.trim(), description.trim(), category]);
    res.json({ success: true });
  } catch (err: any) {
    if (err.sqlState === "45000") {
      res.status(409).json({ success: false, error: "Bug report already exists" });
      return;
    }
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

export default router;
