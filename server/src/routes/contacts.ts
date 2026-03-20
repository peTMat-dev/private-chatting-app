import { Router, Request, Response } from "express";
import { query } from "../services/db";

const router = Router();

type PublicUser = {
  user_id: number;
  display_name: string;
  is_already_contact: number;
};

type Contact = {
  contact_user_id: number;
  display_name: string;
  status: boolean;
  added_at: string;
  is_public: number | null;
};

// GET /contacts - Get user's contact list
router.get("/", async (req: Request, res: Response) => {
  const username = String(req.query.username || "").trim();
  if (!username) {
    return res.status(400).json({ success: false, error: "username is required" });
  }

  try {
    // Get user_id from ldap_uid_id
    const userRows = await query<{ user_id: number }>(
      "SELECT user_id FROM user_main_details WHERE ldap_uid_id = ? LIMIT 1",
      [username]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: "user not found" });
    }
    const userId = userRows[0].user_id;

    // Get user's contacts
    const contacts = await query<Contact>(
      `SELECT c.contact_user_id, umd.display_name, c.status, c.added_at,
              usd.\`public_st\` AS is_public
       FROM contacts c
       JOIN user_main_details umd ON umd.user_id = c.contact_user_id
       LEFT JOIN user_system_details usd ON usd.user_id = c.contact_user_id
       WHERE c.owner_user_id = ?
       ORDER BY umd.display_name ASC`,
      [userId]
    );

    const data = contacts.map((c) => ({
      id: c.contact_user_id,
      displayName: c.display_name,
      status: Boolean(c.status),
      addedAt: c.added_at,
      isPublic: c.is_public === null ? true : Boolean(c.is_public),
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /contacts/public-users - List all publicly available users
router.get("/public-users", async (req: Request, res: Response) => {
  const username = String(req.query.username || "").trim();
  if (!username) {
    return res.status(400).json({ success: false, error: "username is required" });
  }

  try {
    // Get user_id from ldap_uid_id
    const userRows = await query<{ user_id: number }>(
      "SELECT user_id FROM user_main_details WHERE ldap_uid_id = ? LIMIT 1",
      [username]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: "user not found" });
    }
    const userId = userRows[0].user_id;

    // Call stored procedure to get public users with contact status
    const users = await query<PublicUser>("CALL contact_2lookup_public_user(?)", [userId]);
    
    // MySQL stored procedures return results in nested array
    const publicUsers = Array.isArray(users[0]) ? users[0] : users;
    
    const data = publicUsers.map((u: PublicUser) => ({
      id: u.user_id,
      displayName: u.display_name,
      isAlreadyContact: Boolean(u.is_already_contact),
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /contacts/add-public - Add a public user as contact
router.post("/add-public", async (req: Request, res: Response) => {
  const { username, contactUserId } = req.body;

  if (!username || typeof username !== "string") {
    return res.status(400).json({ success: false, error: "username is required" });
  }
  if (!contactUserId || typeof contactUserId !== "number") {
    return res.status(400).json({ success: false, error: "contactUserId is required and must be a number" });
  }

  try {
    // Get user_id from ldap_uid_id
    const userRows = await query<{ user_id: number }>(
      "SELECT user_id FROM user_main_details WHERE ldap_uid_id = ? LIMIT 1",
      [username]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: "user not found" });
    }
    const userId = userRows[0].user_id;

    // Prevent adding self as contact
    if (userId === contactUserId) {
      return res.status(400).json({ success: false, error: "Cannot add yourself as a contact" });
    }

    // Call stored procedure to add contact
    await query(
      "CALL contact_2add_public_user(?, ?)",
      [userId, contactUserId]
    );

    res.json({ success: true, message: "Contact added successfully" });
  } catch (error) {
    const errorMsg = (error as Error).message;
    
    // Handle specific error cases
    if (errorMsg.includes("Contact already exists")) {
      return res.status(409).json({ success: false, error: "Contact already exists" });
    }
    if (errorMsg.includes("not publicly available")) {
      return res.status(403).json({ success: false, error: "User is not publicly available" });
    }
    
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// POST /contacts/request - Look up private user and notify them (notification mechanism TBD)
router.post("/request", async (req: Request, res: Response) => {
  const { username, displayName } = req.body;

  if (!username || typeof username !== "string") {
    return res.status(400).json({ success: false, error: "username is required" });
  }
  if (!displayName || typeof displayName !== "string") {
    return res.status(400).json({ success: false, error: "displayName is required" });
  }

  try {
    const userRows = await query<{ user_id: number }>(
      "SELECT user_id FROM user_main_details WHERE ldap_uid_id = ? LIMIT 1",
      [username]
    );
    if (userRows.length === 0) {
      // Still return success — do not reveal anything to caller
      return res.json({ success: true });
    }
    const userId = userRows[0].user_id;

    // Call SP — result intentionally ignored to preserve privacy
    // Notification mechanism to be implemented separately
    await query("CALL contact_2lookup_added_private_user(?, ?)", [userId, displayName.trim()]);
  } catch (err) {
    // Log server-side only — never expose to caller
    console.error("Private user lookup error:", (err as Error).message);
  }

  // Always return the same response regardless of outcome
  res.json({ success: true });
});

// POST /contacts/remove - Remove a contact
router.post("/remove", async (req: Request, res: Response) => {
  const { username, contactUserId } = req.body;

  if (!username || typeof username !== "string") {
    return res.status(400).json({ success: false, error: "username is required" });
  }
  if (!contactUserId || typeof contactUserId !== "number") {
    return res.status(400).json({ success: false, error: "contactUserId is required and must be a number" });
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

    await query(
      "DELETE FROM contacts WHERE owner_user_id = ? AND contact_user_id = ?",
      [userId, contactUserId]
    );

    res.json({ success: true, message: "Contact removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
