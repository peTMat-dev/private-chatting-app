---
name: contact-face
description: 'Debug, modify, or extend the Contact cube face — the left face of the 3D cube UI in home/page.tsx. Use when asked to fix contact add/remove bugs, add new contact sections, update contact API routes, or change contact UI/UX.'
argument-hint: 'Optional: specify area (e.g. public user list, contact list, whose-contact-am-i, private request, contact routes, stored procedures)'
---

# Contact Face Skill

## File Map

| File | Purpose |
|---|---|
| `client/src/app/home/page.tsx` | All Contact face UI, state, and handlers (lines ~450–870) |
| `client/src/lib/api.ts` | `buildApiUrl()` and `postJson()` — all fetch helpers |
| `client/src/lib/i18n.ts` | All UI strings for the contact face |
| `server/src/routes/contacts.ts` | All 6 REST endpoints for contact operations |
| `server/src/services/db.ts` | `query()` helper — always parameterized, never string-built |
| `client/create_cubcha_v1.sql` | DB schema reference (contacts, contacts_requests, contacts_blocked_users tables) |

---

**State vars, TS types, DB schema, i18n keys, CSS classes:** See [state-reference.md](state-reference.md)

---

## Key Behavioral Decisions

### Non-optimistic updates (add/remove public user)
Optimistic removal sets `isAlreadyContact: false`, removing the button from DOM. A synthetic/ghost click then fires on the parent, immediately re-adding the contact. The fix: set a per-row `addingPublicUserId` / `removingPublicUserId` guard, disable the button (`"…"`), and only update state after the API resolves.

### `handleSendRequest` — privacy protection
Always returns `{ success: true }` and shows `tr.privateRequestSent` regardless of whether the private user was found. Never reveal if a private user exists.

### Section toggles — mutual exclusion
Only one of the four sections is open at a time. Opening a section closes all others and resets their state (search input, request-sent flag, etc.).

---

## Contact List Row

- Private contacts: show 🔒 icon (`!c.isPublic`)
- 💬 chat button: `disabled` with `title={tr.chatSoon}` (not yet implemented)
- ✕ remove: calls `handleRemoveContact(c.id)`, shows `"…"` while `removingContactId === c.id`

## Whose Contact Am I?

- Read-only, no row actions
- Fetched on each open (not cached)
- Fades to 60% opacity while loading

---

## API Endpoints (server/src/routes/contacts.ts)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/contacts` | username query param | Get current user's contact list |
| `GET` | `/contacts/public-users` | username query param | List all public users with contact status |
| `GET` | `/contacts/whose-contact-am-i` | username query param | Find users who have added me as contact |
| `GET` | `/contacts/requests/incoming` | username query param | Get incoming contact requests |
| `GET` | `/contacts/requests/outgoing` | username query param | Get outgoing contact requests |
| `POST` | `/contacts/add-public` | body: `{ username, contactUserId }` | Add a public user as contact |
| `POST` | `/contacts/remove` | body: `{ username, contactUserId }` | Remove a contact |
| `POST` | `/contacts/request` | body: `{ username, displayName }` | Request contact with private user |
| `POST` | `/contacts/requests/approve` | body: `{ username, requestId }` | Approve an incoming contact request |
| `POST` | `/contacts/requests/reject` | body: `{ username, requestId }` | Reject an incoming contact request |
| `POST` | `/contacts/requests/cancel` | body: `{ username, requestId }` | Cancel an outgoing contact request |

All endpoints resolve LDAP username to `user_id` using:
```sql
SELECT user_id FROM user_main_details WHERE ldap_uid_id = ? LIMIT 1
```

---

## Stored Procedures

| Stored Procedure | Arguments | Endpoint |
|---|---|---|
| `contact_2lookup_public_user` | `(userId)` | `GET /contacts/public-users` |
| `contact_2send_public_request` | `(userId, contactUserId)` | `POST /contacts/add-public` |
| `contact_2send_private_request` | `(userId, displayName)` | `POST /contacts/request` |
| `contact_whose_contact_am_I` | `(userId)` | `GET /contacts/whose-contact-am-i` |
| `contact_list_2remove_user` | `(userId, contactUserId)` | `POST /contacts/remove` |
| `contact_2get_incoming_requests` | `(userId)` | `GET /contacts/requests/incoming`, `POST /contacts/requests/approve` |
| `contact_2get_outgoing_requests` | `(userId)` | `GET /contacts/requests/outgoing` |
| `contact_2approve_contact_request` | `(userId, requestId)` | `POST /contacts/requests/approve` |
| `contact_2reject_contact_request` | `(userId, requestId)` | `POST /contacts/requests/reject` |
| `contact_2cancel_contact_request` | `(userId, requestId)` | `POST /contacts/requests/cancel` |

**IMPORTANT — SP result unwrapping:** MySQL stored procedures return results in a nested array. Always unwrap:
```ts
const rows = await query<T>("CALL some_sp(?)", [userId]);
const data = Array.isArray(rows[0]) ? rows[0] : rows;
```
Forgetting this means `data` will be `[[{...}, {...}], OkPacket]` instead of `[{...}, {...}]`.

**Privacy rule for `POST /contacts/request`:** The result of `contact_2lookup_added_private_user` is intentionally ignored and the route always returns `{ success: true }`. Never expose whether a private user was found.

---

## Common Mistakes

| Mistake | Correct |
|---|---|
| Optimistic UI before API responds | Use `removingPublicUserId` / `addingPublicUserId` guard, wait for API |
| Forgetting SP nested array unwrap | `const data = Array.isArray(rows[0]) ? rows[0] : rows;` |
| Revealing private user existence | Always `res.json({ success: true })` regardless of SP result |
| Sending `contactUserId` as string | Server rejects: `typeof contactUserId !== "number"` — always send a number |
| Adding i18n keys in one language | All 6 languages (`en`, `es`, `fr`, `de`, `sk`, `cs`) must be updated |

| Forgetting to call `fetchUserContacts()` after add/remove | Both `handleAddPublicUser` and `handleRemovePublicUser` must refresh the contact list |

---

## Features Not Yet Implemented (NYI)

- **Chat from contact list** — 💬 button is present but `disabled`. Will navigate to the Chat face (right face) when chat routing is implemented.
- **Contact requests system** — `contacts_requests` table exists in schema but is not live. The `/contacts/request` route calls the SP but the notification mechanism is TBD.
- **Block/unblock** — `contacts_blocked_users` table exists in schema, no routes or UI exist yet.
- **Contact request approval** — No UI for pending/approved/rejected states.
