import { Router, Request, Response } from "express";
import { query } from "../services/db";

const router = Router();

type ChatRow = {
  conversation_id: number;
  title: string | null;
  is_group: number | boolean | null;
  last_message_text: string | null;
  last_message_at: string | null;
  participants: string | null;
};

router.get("/", async (req: Request, res: Response) => {
  const username = String(req.query.username || "").trim();
  if (!username) {
    return res.status(400).json({ success: false, error: "username is required" });
  }
  try {
    const userRows = await query<{ user_id: number }>(
      "SELECT user_id FROM user_main_details WHERE ldap_uid_id = ? LIMIT 1",
      [username]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: "user not found" });
    }
    const userId = userRows[0].user_id;

    const rows = await query<ChatRow>(
      `SELECT c.conversation_id,
              c.title,
              c.is_group,
              (
                SELECT m.message_text
                FROM messages m
                WHERE m.conversation_id = c.conversation_id
                ORDER BY m.sent_at DESC
                LIMIT 1
              ) AS last_message_text,
              (
                SELECT DATE_FORMAT(m.sent_at, '%Y-%m-%d %H:%i:%s')
                FROM messages m
                WHERE m.conversation_id = c.conversation_id
                ORDER BY m.sent_at DESC
                LIMIT 1
              ) AS last_message_at,
              (
                SELECT GROUP_CONCAT(umd.display_name SEPARATOR ', ')
                FROM conversations_participants cp2
                JOIN user_main_details umd ON umd.user_id = cp2.user_id
                WHERE cp2.conversation_id = c.conversation_id AND cp2.user_id <> ?
              ) AS participants
       FROM conversations c
       JOIN conversations_participants cp ON cp.conversation_id = c.conversation_id
       WHERE cp.user_id = ?
       ORDER BY c.conversation_id DESC`,
      [userId, userId]
    );

    const data = rows.map((r) => ({
      id: r.conversation_id,
      name: r.title && r.title.trim() ? r.title : r.participants || "Untitled",
      lastMessage: r.last_message_text || "",
      lastAt: r.last_message_at || null,
      isGroup: Boolean(r.is_group),
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
