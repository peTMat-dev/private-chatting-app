import { Router, Request, Response } from "express";
import { query } from "../services/db";

const router = Router();

type UserSystemDetails = {
  user_language: string;
  default_max_chat_participants: number;
  public_st: boolean;
  user_timezone: string;
  can_be_added_to_contacts: boolean;
  system_color_theme: 'light' | 'dark';
  cube_color: string;
  cube_color2: string;
};

type TimezoneRow = {
  timezone_name: string;
  display_name: string;
};

// GET /settings
router.get("/", async (req: Request, res: Response) => {
  const { userId } = req.user;

  try {
    // Get user system details
    const settingsRows = await query<UserSystemDetails & { display_name: string }>(
      `SELECT usd.user_language, usd.default_max_chat_participants, usd.public_st, usd.user_timezone, usd.can_be_added_to_contacts, usd.system_color_theme, usd.cube_color, usd.cube_color2, umd.display_name
       FROM user_system_details usd
       JOIN user_main_details umd ON umd.user_id = usd.user_id
       WHERE usd.user_id = ? LIMIT 1`,
      [userId]
    );

    if (!settingsRows || settingsRows.length === 0) {
      return res.status(404).json({ success: false, error: "User settings not found" });
    }

    const settings = {
      user_language: settingsRows[0].user_language,
      default_max_chat_participants: settingsRows[0].default_max_chat_participants,
      public_st: Boolean(settingsRows[0].public_st),
      user_timezone: settingsRows[0].user_timezone,
      can_be_added_to_contacts: Boolean(settingsRows[0].can_be_added_to_contacts),
      system_color_theme: settingsRows[0].system_color_theme || 'dark',
      cube_color: settingsRows[0].cube_color || '#06ec90',
      cube_color2: settingsRows[0].cube_color2 || '#03a062',
      display_name: settingsRows[0].display_name,
    };

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ success: false, error: "Failed to fetch settings" });
  }
});

// GET /settings/timezones
router.get("/timezones", async (_req: Request, res: Response) => {
  try {
    const timezones = await query<TimezoneRow>(
      "SELECT timezone_name, display_name FROM timezones ORDER BY display_name"
    );

    const data: TimezoneRow[] = timezones.map((tz) => ({
      timezone_name: tz.timezone_name,
      display_name: tz.display_name,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching timezones:", error);
    res.status(500).json({ success: false, error: "Failed to fetch timezones" });
  }
});

// PUT /settings
router.put("/", async (req: Request, res: Response) => {
  const { user_language, default_max_chat_participants, public_st: isPublic, user_timezone, can_be_added_to_contacts, system_color_theme, cube_color, cube_color2 } = req.body;
  const { userId } = req.user;

  try {

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];

    if (user_language !== undefined && typeof user_language === "string") {
      updates.push("user_language = ?");
      values.push(user_language);
    }

    if (default_max_chat_participants !== undefined && typeof default_max_chat_participants === "number") {
      if (default_max_chat_participants < 2 || default_max_chat_participants > 100) {
        return res.status(400).json({ 
          success: false, 
          error: "default_max_chat_participants must be between 2 and 100" 
        });
      }
      updates.push("default_max_chat_participants = ?");
      values.push(default_max_chat_participants);
    }

    if (isPublic !== undefined && typeof isPublic === "boolean") {
      updates.push("public_st = ?");
      values.push(isPublic);
    }

    if (can_be_added_to_contacts !== undefined && typeof can_be_added_to_contacts === "boolean") {
      updates.push("can_be_added_to_contacts = ?");
      values.push(can_be_added_to_contacts);
    }

    if (user_timezone !== undefined && typeof user_timezone === "string") {
      // Validate timezone exists
      const tzRows = await query<{ timezone_name: string }>(
        "SELECT timezone_name FROM timezones WHERE timezone_name = ? LIMIT 1",
        [user_timezone]
      );
      
      if (!tzRows || tzRows.length === 0) {
        return res.status(400).json({ success: false, error: "Invalid timezone" });
      }
      
      updates.push("user_timezone = ?");
      values.push(user_timezone);
    }

    if (system_color_theme !== undefined && (system_color_theme === 'light' || system_color_theme === 'dark')) {
      updates.push("system_color_theme = ?");
      values.push(system_color_theme);
    }

    if (cube_color !== undefined && typeof cube_color === 'string') {
      // Validate hex color format (#RRGGBB)
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!hexColorRegex.test(cube_color)) {
        return res.status(400).json({ 
          success: false, 
          error: "cube_color must be a valid hex color (e.g., #06ec90)" 
        });
      }
      updates.push("cube_color = ?");
      values.push(cube_color);
    }

    if (cube_color2 !== undefined && typeof cube_color2 === 'string') {
      // Validate hex color format (#RRGGBB)
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!hexColorRegex.test(cube_color2)) {
        return res.status(400).json({ 
          success: false, 
          error: "cube_color2 must be a valid hex color (e.g., #03a062)" 
        });
      }
      updates.push("cube_color2 = ?");
      values.push(cube_color2);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: "No valid fields to update" });
    }

    values.push(userId);
    const sql = `UPDATE user_system_details SET ${updates.join(", ")} WHERE user_id = ?`;
    
    await query(sql, values);

    res.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ success: false, error: "Failed to update settings" });
  }
});

export default router;
