import { Router, Request, Response } from "express";
import { query } from "../services/db";
import { emitToUser } from "../services/socket.service";

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

// POST /chats - Create or retrieve a conversation
router.post("/", async (req: Request, res: Response) => {
  const { username, participantUserIds, title } = req.body as {
    username: string;
    participantUserIds: number[];
    title?: string;
  };

  if (!username || typeof username !== "string") {
    return res.status(400).json({ success: false, error: "username is required" });
  }
  if (!Array.isArray(participantUserIds) || participantUserIds.length === 0) {
    return res.status(400).json({ success: false, error: "participantUserIds must be a non-empty array" });
  }
  const isGroup = participantUserIds.length > 1;
  if (isGroup && (!title || !title.trim())) {
    return res.status(400).json({ success: false, error: "title is required for group chats" });
  }

  try {
    // Resolve caller
    const userRows = await query<{ user_id: number; default_max_chat_participants: number }>(
      `SELECT umd.user_id, usd.default_max_chat_participants
       FROM user_main_details umd
       JOIN user_system_details usd ON usd.user_id = umd.user_id
       WHERE umd.ldap_uid_id = ? LIMIT 1`,
      [username]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: "user not found" });
    }
    const { user_id: userId, default_max_chat_participants: maxParticipants } = userRows[0];

    // Security: all participantUserIds must be in caller's contacts
    const placeholders = participantUserIds.map(() => "?").join(", ");
    const contactRows = await query<{ contact_user_id: number }>(
      `SELECT contact_user_id FROM contacts WHERE owner_user_id = ? AND contact_user_id IN (${placeholders})`,
      [userId, ...participantUserIds]
    );
    if (contactRows.length !== participantUserIds.length) {
      return res.status(403).json({ success: false, error: "All participants must be in your contacts" });
    }

    let conversationId: number;
    let name: string;

    if (!isGroup) {
      // 1-on-1: reuse existing conversation if it exists between exactly these two users
      const otherId = participantUserIds[0];
      const existing = await query<{ conversation_id: number; title: string | null; participants: string | null }>(
        `SELECT c.conversation_id, c.title,
                (SELECT GROUP_CONCAT(umd.display_name SEPARATOR ', ')
                 FROM conversations_participants cp2
                 JOIN user_main_details umd ON umd.user_id = cp2.user_id
                 WHERE cp2.conversation_id = c.conversation_id AND cp2.user_id <> ?) AS participants
         FROM conversations c
         JOIN conversations_participants cp1 ON cp1.conversation_id = c.conversation_id AND cp1.user_id = ?
         JOIN conversations_participants cp2 ON cp2.conversation_id = c.conversation_id AND cp2.user_id = ?
         WHERE c.is_group = FALSE
           AND (SELECT COUNT(*) FROM conversations_participants cp3 WHERE cp3.conversation_id = c.conversation_id) = 2
         LIMIT 1`,
        [userId, userId, otherId]
      );
      if (existing.length > 0) {
        conversationId = existing[0].conversation_id;
        name = existing[0].title?.trim() || existing[0].participants || "Chat";
        return res.json({ success: true, data: { conversationId, name, isGroup: false } });
      }

      // Create new 1-on-1
      const result = await query<{ insertId: number }>(
        "INSERT INTO conversations (creator_user_id, is_group, max_participants) VALUES (?, FALSE, 2)",
        [userId]
      );
      conversationId = (result as any).insertId;
      await query(
        "INSERT INTO conversations_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)",
        [conversationId, userId, conversationId, otherId]
      );
      // Resolve name from other user's display_name
      const nameRow = await query<{ display_name: string }>(
        "SELECT display_name FROM user_main_details WHERE user_id = ? LIMIT 1",
        [otherId]
      );
      name = nameRow[0]?.display_name || "Chat";
    } else {
      // Group: always create new
      const result = await query<{ insertId: number }>(
        "INSERT INTO conversations (creator_user_id, is_group, title, max_participants) VALUES (?, TRUE, ?, ?)",
        [userId, title!.trim(), maxParticipants]
      );
      conversationId = (result as any).insertId;
      const allParticipants = [userId, ...participantUserIds];
      const participantValues = allParticipants.map(() => "(?, ?)").join(", ");
      const participantParams = allParticipants.flatMap((id) => [conversationId, id]);
      await query(
        `INSERT INTO conversations_participants (conversation_id, user_id) VALUES ${participantValues}`,
        participantParams
      );
      name = title!.trim();
    }

    res.json({ success: true, data: { conversationId, name, isGroup } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /chats/:id/messages - Get last 100 messages for a conversation
router.get("/:id/messages", async (req: Request, res: Response) => {
  const conversationId = Number(req.params.id);
  const username = String(req.query.username || "").trim();

  if (!username) {
    return res.status(400).json({ success: false, error: "username is required" });
  }
  if (!conversationId) {
    return res.status(400).json({ success: false, error: "invalid conversation id" });
  }

  try {
    // Resolve caller
    const userRows = await query<{ user_id: number }>(
      "SELECT user_id FROM user_main_details WHERE ldap_uid_id = ? LIMIT 1",
      [username]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: "user not found" });
    }
    const userId = userRows[0].user_id;

    // Verify membership
    const membership = await query<{ user_id: number }>(
      "SELECT user_id FROM conversations_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1",
      [conversationId, userId]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, error: "Not a participant of this conversation" });
    }

    type MessageRow = {
      message_id: number;
      message_text: string;
      sent_at: string;
      sender_display_name: string;
      sender_user_id: number;
    };
    const messages = await query<MessageRow>(
      `SELECT m.message_id, m.message_text, DATE_FORMAT(m.sent_at, '%Y-%m-%dT%H:%i:%sZ') AS sent_at,
              umd.display_name AS sender_display_name, umd.user_id AS sender_user_id
       FROM messages m
       JOIN user_main_details umd ON umd.user_id = m.sender_user_id
       WHERE m.conversation_id = ?
       ORDER BY m.sent_at ASC
       LIMIT 100`,
      [conversationId]
    );

    const data = messages.map((m) => ({
      messageId: m.message_id,
      text: m.message_text,
      sentAt: m.sent_at,
      senderDisplayName: m.sender_display_name,
      senderUserId: m.sender_user_id,
      isOwn: m.sender_user_id === userId,
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /chats/:id/messages - Send a message
router.post("/:id/messages", async (req: Request, res: Response) => {
  const conversationId = Number(req.params.id);
  const { username, text } = req.body as { username: string; text: string };

  if (!username || typeof username !== "string") {
    return res.status(400).json({ success: false, error: "username is required" });
  }
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, error: "text is required" });
  }
  if (!conversationId) {
    return res.status(400).json({ success: false, error: "invalid conversation id" });
  }

  try {
    // Resolve caller
    const userRows = await query<{ user_id: number; display_name: string }>(
      "SELECT user_id, display_name FROM user_main_details WHERE ldap_uid_id = ? LIMIT 1",
      [username]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: "user not found" });
    }
    const { user_id: userId, display_name: senderDisplayName } = userRows[0];

    // Verify membership
    const membership = await query<{ user_id: number }>(
      "SELECT user_id FROM conversations_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1",
      [conversationId, userId]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, error: "Not a participant of this conversation" });
    }

    // Insert message
    const result = await query<{ insertId: number }>(
      "INSERT INTO messages (conversation_id, sender_user_id, sender_username, message_text, sent_at) VALUES (?, ?, ?, ?, NOW())",
      [conversationId, userId, username, text.trim()]
    );
    const messageId = (result as any).insertId;

    // Get sent_at back from DB
    const sentRow = await query<{ sent_at: string }>(
      "SELECT DATE_FORMAT(sent_at, '%Y-%m-%dT%H:%i:%sZ') AS sent_at FROM messages WHERE message_id = ? LIMIT 1",
      [messageId]
    );
    const sentAt = sentRow[0]?.sent_at || new Date().toISOString();

    // Emit new_message to all participants
    const participants = await query<{ user_id: number }>(
      "SELECT user_id FROM conversations_participants WHERE conversation_id = ?",
      [conversationId]
    );
    const payload = { conversationId, messageId, text: text.trim(), senderUserId: userId, senderDisplayName, sentAt };
    for (const p of participants) {
      emitToUser(p.user_id, "new_message", payload);
    }

    res.json({ success: true, data: { messageId, sentAt } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
