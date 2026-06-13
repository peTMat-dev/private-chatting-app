import { Router, Request, Response } from "express";
import { query } from "../services/db";
import { emitToUser } from "../services/socket.service";

const router = Router();

type PublicUser = {
  user_id: number;
  display_name: string;
  is_already_contact: number;
  can_be_added_to_contacts: number;
  has_pending_request: number;
};

type ContactRequest = {
  request_id: number;
  user_id: number;
  display_name: string;
  requested_at: string;
};

type Contact = {
  contact_user_id: number;
  display_name: string;
  status_st: boolean;
  added_at: string;
  is_public: number | null;
};

// GET /contacts - Get user's contact list
router.get("/", async (req: Request, res: Response) => {
  const { userId } = req.user;

  try {

    // Get user's contacts
    const contacts = await query<Contact>(
      `SELECT c.contact_user_id, umd.display_name, c.status_st, c.added_at,
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
      status_st: Boolean(c.status_st),
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
  const { userId } = req.user;

  try {
    // Call stored procedure to get public users with contact status
    const users = await query<PublicUser>("CALL contact_2lookup_public_user(?)", [userId]);
    
    // MySQL stored procedures return results in nested array
    const publicUsers = Array.isArray(users[0]) ? users[0] : users;
    
    const data = publicUsers.map((u: PublicUser) => ({
      id: u.user_id,
      displayName: u.display_name,
      isAlreadyContact: Boolean(u.is_already_contact),
      canBeAddedToContacts: Boolean(u.can_be_added_to_contacts),
      hasPendingRequest: Boolean(u.has_pending_request),
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /contacts/add-public - Add a public user as contact
router.post("/add-public", async (req: Request, res: Response) => {
  const { contactUserId } = req.body;
  const { userId } = req.user;

  if (!contactUserId || typeof contactUserId !== "number") {
    return res.status(400).json({ success: false, error: "contactUserId is required and must be a number" });
  }

  try {

    // Prevent adding self as contact
    if (userId === contactUserId) {
      return res.status(400).json({ success: false, error: "Cannot add yourself as a contact" });
    }

    // Call stored procedure to send contact request
    await query(
      "CALL contact_2send_public_request(?, ?)",
      [userId, contactUserId]
    );

    res.json({ success: true, message: "Contact request sent successfully" });
  } catch (error) {
    const errorMsg = (error as Error).message;
    
    // Handle specific error cases
    if (errorMsg.includes("Request already pending")) {
      return res.status(409).json({ success: false, error: "Request already pending" });
    }
    if (errorMsg.includes("not publicly available")) {
      return res.status(403).json({ success: false, error: "User is not publicly available" });
    }
    
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// POST /contacts/request - Look up private user and notify them (notification mechanism TBD)
router.post("/request", async (req: Request, res: Response) => {
  const { displayName } = req.body;
  const { userId } = req.user;

  if (!displayName || typeof displayName !== "string") {
    return res.status(400).json({ success: false, error: "displayName is required" });
  }

  try {

    // Call SP — result intentionally ignored to preserve privacy
    await query("CALL contact_2send_private_request(?, ?)", [userId, displayName.trim()]);
  } catch (err) {
    // Log server-side only — never expose to caller
    console.error("Private user lookup error:", (err as Error).message);
  }

  // Always return the same response regardless of outcome
  res.json({ success: true });
});

// GET /contacts/whose-contact-am-i - Find users who have added the current user as a contact
router.get("/whose-contact-am-i", async (req: Request, res: Response) => {
  const { userId } = req.user;

  try {

    const rows = await query<{ user_id: number; display_name: string }>(
      "CALL contact_in_whose_group_contact_am_I(?)",
      [userId]
    );

    // MySQL stored procedures return results in nested array
    const resultRows = Array.isArray(rows[0]) ? rows[0] : rows;

    const data = resultRows.map((r: { user_id: number; display_name: string }) => ({
      id: r.user_id,
      displayName: r.display_name,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /contacts/remove - Remove a contact
router.post("/remove", async (req: Request, res: Response) => {
  const { contactUserId } = req.body;
  const { userId } = req.user;

  if (!contactUserId || typeof contactUserId !== "number") {
    return res.status(400).json({ success: false, error: "contactUserId is required and must be a number" });
  }

  try {

    await query(
      "CALL contact_list_2remove_user(?, ?)",
      [userId, contactUserId]
    );

    res.json({ success: true, message: "Contact removed successfully" });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes("does not exist") || msg.includes("DOES NOT")) {
      return res.status(404).json({ success: false, error: "Contact does not exist" });
    }
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /contacts/requests/incoming - Get incoming contact requests
router.get("/requests/incoming", async (req: Request, res: Response) => {
  const { userId } = req.user;

  try {

    const rows = await query<ContactRequest>("CALL contact_2get_incoming_requests(?)", [userId]);
    const resultRows = Array.isArray(rows[0]) ? rows[0] : rows;

    const data = (resultRows as ContactRequest[]).map((r) => ({
      requestId: r.request_id,
      userId: r.user_id,
      displayName: r.display_name,
      requestedAt: r.requested_at,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /contacts/requests/outgoing - Get outgoing contact requests
router.get("/requests/outgoing", async (req: Request, res: Response) => {
  const { userId } = req.user;

  try {

    const rows = await query<ContactRequest>("CALL contact_2get_outgoing_requests(?)", [userId]);
    const resultRows = Array.isArray(rows[0]) ? rows[0] : rows;

    const data = (resultRows as ContactRequest[]).map((r) => ({
      requestId: r.request_id,
      userId: r.user_id,
      displayName: r.display_name,
      requestedAt: r.requested_at,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /contacts/requests/approve - Approve an incoming contact request
router.post("/requests/approve", async (req: Request, res: Response) => {
  const { requestId } = req.body;
  const { userId } = req.user;

  if (!requestId || typeof requestId !== "number") {
    return res.status(400).json({ success: false, error: "requestId is required and must be a number" });
  }

  try {
    const userRows = await query<{ display_name: string }>(
      "SELECT display_name FROM user_main_details WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: "user not found" });
    }
    const approverDisplayName = userRows[0].display_name;

    // Use existing SP to find the requester before approving
    type IncomingRequest = { request_id: number; requester_user_id: number; display_name: string; requested_at: string };
    const incomingRaw = await query<IncomingRequest>("CALL contact_2get_incoming_requests(?)", [userId]);
    const incomingRows: IncomingRequest[] = Array.isArray(incomingRaw[0]) ? (incomingRaw[0] as IncomingRequest[]) : (incomingRaw as IncomingRequest[]);
    const matched = incomingRows.find((r) => r.request_id === requestId);

    await query("CALL contact_2approve_contact_request(?, ?)", [userId, requestId]);

    if (matched) {
      emitToUser(matched.requester_user_id, "contact_approved", { userId, displayName: approverDisplayName });
    }

    res.json({ success: true, message: "Contact request approved" });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes("not found or already actioned")) {
      return res.status(404).json({ success: false, error: "Request not found or already actioned" });
    }
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /contacts/requests/reject - Reject an incoming contact request
router.post("/requests/reject", async (req: Request, res: Response) => {
  const { requestId } = req.body;
  const { userId } = req.user;

  if (!requestId || typeof requestId !== "number") {
    return res.status(400).json({ success: false, error: "requestId is required and must be a number" });
  }

  try {

    await query("CALL contact_2reject_contact_request(?, ?)", [userId, requestId]);

    res.json({ success: true, message: "Contact request rejected" });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes("not found or already actioned")) {
      return res.status(404).json({ success: false, error: "Request not found or already actioned" });
    }
    res.status(500).json({ success: false, error: msg });
  }
});

// POST /contacts/requests/cancel - Cancel an outgoing contact request
router.post("/requests/cancel", async (req: Request, res: Response) => {
  const { requestId } = req.body;
  const { userId } = req.user;

  if (!requestId || typeof requestId !== "number") {
    return res.status(400).json({ success: false, error: "requestId is required and must be a number" });
  }

  try {

    await query("CALL contact_2cancel_contact_request(?, ?)", [userId, requestId]);

    res.json({ success: true, message: "Contact request cancelled" });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes("not found or already actioned")) {
      return res.status(404).json({ success: false, error: "Request not found or already actioned" });
    }
    res.status(500).json({ success: false, error: msg });
  }
});

// GET /contacts/groups - Get user's contact groups (owner only)
router.get("/groups", async (req: Request, res: Response) => {
  const { userId } = req.user;

  try {
    const rows = await query<{
      group_ug_id: number;
      group_name: string;
      owner_user_id: number;
      member_user_id: number;
    }>("CALL contact_2read_c_list_groups(?)", [userId]);

    const resultRows = Array.isArray(rows[0]) ? rows[0] : rows;

    // Aggregate multiple member rows into one entry per group
    const groupMap = new Map<number, { id: number; name: string; memberIds: number[] }>();
    for (const row of resultRows as { group_ug_id: number; group_name: string; member_user_id: number }[]) {
      if (!groupMap.has(row.group_ug_id)) {
        groupMap.set(row.group_ug_id, { id: row.group_ug_id, name: row.group_name, memberIds: [] });
      }
      groupMap.get(row.group_ug_id)!.memberIds.push(row.member_user_id);
    }

    const data = Array.from(groupMap.values());
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /contacts/groups/init - Phase 1: create group + auto-assign ungrouped contacts
router.post("/groups/init", async (req: Request, res: Response) => {
  const { groupName } = req.body;
  const { userId } = req.user;

  if (!groupName || typeof groupName !== "string" || !groupName.trim()) {
    return res.status(400).json({ success: false, error: "groupName is required" });
  }

  try {
    const rows = await query<{ group_id: number }>(
      "CALL contact_2create_group_p1(?, ?)",
      [userId, groupName.trim().slice(0, 32)]
    );
    const resultRows = Array.isArray(rows[0]) ? rows[0] : rows;
    const groupId = (resultRows as { group_id: number }[])[0]?.group_id;
    if (!groupId) {
      return res.status(500).json({ success: false, error: "Failed to create group" });
    }
    res.json({ success: true, data: { groupId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// POST /contacts/groups/:id/members - Phase 2: add selected contacts as group members
router.post("/groups/:id/members", async (req: Request, res: Response) => {
  const groupId = parseInt(req.params.id as string, 10);
  const { memberIds } = req.body;
  const { userId } = req.user;

  if (!groupId || isNaN(groupId)) {
    return res.status(400).json({ success: false, error: "Valid groupId is required" });
  }
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ success: false, error: "memberIds must be a non-empty array" });
  }
  if (!memberIds.every((id) => Number.isInteger(id) && id > 0)) {
    return res.status(400).json({ success: false, error: "All memberIds must be positive integers" });
  }

  const memberIdsStr = memberIds.join(",");

  try {
    await query("CALL contact_2create_group_p2(?, ?, ?)", [groupId, userId, memberIdsStr]);
    res.json({ success: true, message: "Members added to group" });
  } catch (error) {
    const msg = (error as Error).message;
    if (msg.includes("Group not found or not owned by user")) {
      return res.status(403).json({ success: false, error: "Group not found or not owned by user" });
    }
    res.status(500).json({ success: false, error: msg });
  }
});

export default router;
