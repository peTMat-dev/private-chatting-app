---
name: contact-face
description: 'Debug, modify, or extend the Contact cube face — the left face of the 3D cube UI in home/page.tsx. Use when asked to fix contact add/remove bugs, add new contact sections, update contact API routes, or change contact UI/UX.'
argument-hint: 'Optional: specify area (e.g. public user list, contact list, whose-contact-am-i, private request, contact routes, stored procedures)'
---

# Contact Face Skill

## What This Skill Covers

The **Contact face** is the **left face** of the rotating cube in `client/src/app/home/page.tsx`. It is rendered inside `<section className="cube-face cube-face-left">` and contains four expandable sections, each toggled by a button:

1. **Public User** — Browse and add/remove publicly visible users
2. **Request by Name** — Send a name-based contact request to a private user
3. **Contact List** — View and remove existing contacts
4. **Whose Contact Am I?** — Read-only list of users who have added the current user

---

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

## State Variables (in `home/page.tsx`)

```ts
// Contact list data
const [userContacts, setUserContacts] = useState<ContactItem[]>([]);
const [contactsError, setContactsError] = useState<string | null>(null);

// Public users
const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
const [loadingPublicUsers, setLoadingPublicUsers] = useState(false);
const [publicUserSearch, setPublicUserSearch] = useState("");
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

// Contact list display
const [showContactList, setShowContactList] = useState(false);
const [contactSearch, setContactSearch] = useState("");
const [contactSortOrder, setContactSortOrder] = useState<"asc" | "desc">("asc");

// Panel visibility toggles (only one open at a time)
const [showPublicUserSelect, setShowPublicUserSelect] = useState(false);
const [showRequestInput, setShowRequestInput] = useState(false);

// Private request
const [requestDisplayName, setRequestDisplayName] = useState("");
const [privateRequestSent, setPrivateRequestSent] = useState(false);

// Loading/busy state for individual rows (prevents double-submit)
const [removingContactId, setRemovingContactId] = useState<number | null>(null);
const [removingPublicUserId, setRemovingPublicUserId] = useState<number | null>(null);
const [addingPublicUserId, setAddingPublicUserId] = useState<number | null>(null);

// Whose Contact Am I
const [whoseContactAmI, setWhoseContactAmI] = useState<{ id: number; displayName: string }[]>([]);
const [showWhoseContactAmI, setShowWhoseContactAmI] = useState(false);
const [loadingWhoseContactAmI, setLoadingWhoseContactAmI] = useState(false);
```

### TypeScript Types

```ts
type ContactItem = {
  id: number;
  displayName: string;
  status_st: boolean;
  addedAt: string;
  isPublic: boolean;           // false = private user (🔒 shown in Contact List)
};

type PublicUser = {
  id: number;
  displayName: string;
  isAlreadyContact: boolean;
};
```

---

## Handler Functions

### `fetchPublicUsers()`
- Calls `GET /contacts/public-users?username=<username>`
- Sets `publicUsers` state
- Shows alert dialog on error

### `fetchUserContacts()`
- Calls `GET /contacts?username=<username>`
- Refreshes `userContacts` state after add/remove operations

### `fetchWhoseContactAmI()`
- Calls `GET /contacts/whose-contact-am-i?username=<username>`
- Sets `whoseContactAmI` state
- Triggered once each time the "Whose Contact Am I?" section is opened

### `handleAddPublicUser(userId, displayName)`
- **Non-optimistic**: sets `addingPublicUserId = userId` → calls POST → updates `publicUsers` → calls `fetchUserContacts()` → clears state
- Shows alert on error
- Does NOT modify UI before API succeeds

### `handleRemovePublicUser(userId)`
- **Non-optimistic**: sets `removingPublicUserId = userId` → calls POST → updates `publicUsers` → calls `fetchUserContacts()` → clears state
- Shows alert on error
- Does NOT modify UI before API succeeds

### `handleRemoveContact(contactId)`
- **Non-optimistic**: sets `removingContactId = contactId` → calls POST → filters `userContacts` → updates `publicUsers` (marks as not contact) → clears state

### `handleSendRequest()`
- Calls `POST /contacts/request` with `{ username, displayName }`
- **Always shows the same success message regardless of outcome** (privacy protection — never reveal if a private user exists)
- Resets `requestDisplayName`, sets `privateRequestSent = true`

---

## Public User Section — UX Design (Option A)

**Key design decision:** Panel visibility toggles are mutually exclusive. Opening one section closes all others.

**Public User row layout:**
- Each row is a `<div>` with `cursor: "default"` — the row itself is NOT clickable
- A single always-visible button at the end of the row shows:
  - `"…"` when busy (adding or removing in progress)
  - `"✓"` when already a contact → clicking calls `handleRemovePublicUser`
  - `"○"` when NOT a contact → clicking calls `handleAddPublicUser`
- The button uses CSS classes `contact-action-btn contact-action-btn--remove` (for contact) or `contact-action-btn contact-action-btn--add` (for non-contact)

**Why non-optimistic updates?** Optimistic removal sets `isAlreadyContact: false`, which removes the button from DOM. A synthetic/ghost click then fires on the parent, re-adding the contact immediately. The non-optimistic approach (disable + spinner) prevents this.

**isBusy guard:**
```tsx
const isBusy = removingPublicUserId === user.id || addingPublicUserId === user.id;
```
When `isBusy`, button shows `"…"` and is `disabled={true}`. The `loadingPublicUsers` flag also disables all buttons during full list refresh.

---

## Contact List Section

- Existing contacts from `userContacts` array
- Private contacts shown with a 🔒 icon next to display name (`!c.isPublic`)
- Two buttons per row:
  - 💬 (chat) — currently `disabled` with `title={tr.chatSoon}` (feature not yet implemented)
  - ✕ (remove) — calls `handleRemoveContact(c.id)`, shows `"…"` while `removingContactId === c.id`
- Sortable A-Z / Z-A with search filter (same pattern as public user list)

---

## Whose Contact Am I? Section

- Read-only list — no actions, no buttons on rows
- Shows `—` (em dash) when empty
- Fades list to 60% opacity while loading (`opacity: loadingWhoseContactAmI ? 0.6 : 1`)
- Fetched on each open (not cached between opens)

---

## API Endpoints (server/src/routes/contacts.ts)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/contacts` | username query param | Get current user's contact list |
| `GET` | `/contacts/public-users` | username query param | List all public users with contact status |
| `GET` | `/contacts/whose-contact-am-i` | username query param | Find users who have added me as contact |
| `POST` | `/contacts/add-public` | body: `{ username, contactUserId }` | Add a public user as contact |
| `POST` | `/contacts/remove` | body: `{ username, contactUserId }` | Remove a contact |
| `POST` | `/contacts/request` | body: `{ username, displayName }` | Request contact with private user |

All endpoints resolve LDAP username to `user_id` using:
```sql
SELECT user_id FROM user_main_details WHERE ldap_uid_id = ? LIMIT 1
```

---

## Stored Procedures

| Stored Procedure | Used In | Arguments |
|---|---|---|
| `contact_2lookup_public_user(userId)` | `GET /contacts/public-users` | Caller's `user_id` |
| `contact_2add_public_user(userId, contactUserId)` | `POST /contacts/add-public` | Caller + target `user_id` |
| `contact_2lookup_added_private_user(userId, displayName)` | `POST /contacts/request` | Caller `user_id` + display name string |
| `contact_whose_contact_am_I(userId)` | `GET /contacts/whose-contact-am-i` | Caller's `user_id` |
| `contact_list_2remove_user(userId, contactUserId)` | `POST /contacts/remove` | Caller + target `user_id` |

**IMPORTANT — SP result unwrapping:** MySQL stored procedures return results in a nested array. Always unwrap:
```ts
const rows = await query<T>("CALL some_sp(?)", [userId]);
const data = Array.isArray(rows[0]) ? rows[0] : rows;
```
Forgetting this means `data` will be `[[{...}, {...}], OkPacket]` instead of `[{...}, {...}]`.

**Privacy rule for `POST /contacts/request`:** The result of `contact_2lookup_added_private_user` is intentionally ignored and the route always returns `{ success: true }`. Never expose whether a private user was found.

---

## DB Schema (Relevant Tables)

```sql
-- contacts table (live)
contacts (
  owner_user_id  SMALLINT UNSIGNED,   -- who owns this contact
  contact_user_id SMALLINT UNSIGNED,  -- who is the contact
  status_st      BOOLEAN,             -- active/removed
  added_at       DATETIME
  PK: (owner_user_id, contact_user_id)
)

-- user_system_details (live, relevant fields)
user_system_details (
  user_id        SMALLINT UNSIGNED PK,
  public_st      BOOLEAN,             -- true = profile is publicly visible
  can_be_added_to_contacts BOOLEAN    -- true = can appear in public user list
)

-- contacts_requests (schema exists, NYI in live)
contacts_requests (
  request_id          INT UNSIGNED PK AUTO_INCREMENT,
  requester_user_id   SMALLINT UNSIGNED,
  target_user_id      SMALLINT UNSIGNED,
  status_st           ENUM('pending','approved','rejected','cancelled'),
  requested_at        DATETIME,
  ...
)

-- contacts_blocked_users (schema exists, NYI in live)
contacts_blocked_users (
  blocker_user_id     SMALLINT UNSIGNED,
  blocked_user_id     SMALLINT UNSIGNED,
  blocked_at          DATETIME
  PK: (blocker_user_id, blocked_user_id)
)
```

Note: `public_st` column in `user_system_details` is referenced in `contacts.ts` as `` `public_st` `` in backticks within the SQL alias — do not confuse with the `public` key in the TypeScript `UserSettings` type (the settings route aliases it as `public`).

---

## i18n Keys — Contact Face

All UI strings must come from `lib/i18n.ts` via `t(lang)`. Contact-relevant keys:

```ts
tr.contacts           // Section heading
tr.addPublicUser      // "Public User" button label
tr.loadingUsers       // Spinner text in public user list and whose-contact-am-i
tr.noPublicUsers      // Empty state text for public user list
tr.requestByName      // "Request by Name" button label
tr.enterDisplayName   // Placeholder for private request input
tr.sendRequest        // (key exists but tr.chatSoon used for chat button title)
tr.privateRequestSent // Neutral message after sending request
tr.contactList        // "☰ Contact List" button label (prefix ☰ hardcoded in JSX)
tr.noContactsYet      // Empty state text for contact list
tr.couldNotLoadContacts // Error state text
tr.chatSoon           // Tooltip for disabled chat button in contact list
tr.whoseContactAmI    // "Whose Contact Am I?" button label
```

Always check `lib/i18n.ts` for existing keys before adding new translation entries. All 6 languages (`en`, `es`, `fr`, `de`, `sk`, `cs`) must be updated simultaneously.

---

## Section Toggle Pattern

All four sections follow this mutual-exclusion pattern — only one section is open at a time. When toggling a section open, close all others:

```ts
// Example: opening "Contact List"
setShowContactList(!showContactList);
setShowPublicUserSelect(false);
setShowRequestInput(false);
setPrivateRequestSent(false);
setContactSearch("");
```

Each section's content appears as a `<div style={{ marginTop: "0.75rem" }}>` rendered conditionally below its toggle button.

---

## CSS Classes (Contact Face)

| Class | Usage |
|---|---|
| `add-contact-btn` | Full-width section toggle buttons (Public User, Request by Name, etc.) |
| `sort-btn` | A-Z / Z-A sort buttons and search clear button |
| `sort-btn active` | Active sort direction |
| `contact-action-btn` | Base for per-row action buttons |
| `contact-action-btn--add` | Green-styled add/check button |
| `contact-action-btn--remove` | Red/muted remove button |
| `contact-action-btn--chat` | Chat icon button (currently disabled) |
| `auth-input` | Scrollable list container (`maxHeight: "180px"`, `overflowY: "auto"`) |

---

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| Optimistic UI: update state before API responds | Always use `removingPublicUserId` / `addingPublicUserId` to show `"…"` and wait for API |
| Forgetting SP nested array unwrap | `const data = Array.isArray(rows[0]) ? rows[0] : rows;` |
| Revealing private user existence in `/contacts/request` | Always call `res.json({ success: true })` regardless of SP result |
| Making Public User rows clickable | Row `<div>` uses `cursor: "default"` — only the button is interactive |
| Opening two sections simultaneously | Each section toggle must close all other sections first |
| Using `contactUserId` as a string | The server validates `typeof contactUserId !== "number"` — always send a number |
| Adding new i18n keys in only one language | All 6 language entries in `translations` record must be updated |
| Forgetting to call `fetchUserContacts()` after add/remove | Both `handleAddPublicUser` and `handleRemovePublicUser` must refresh the contact list |

---

## Features Not Yet Implemented (NYI)

- **Chat from contact list** — 💬 button is present but `disabled`. Will navigate to the Chat face (right face) when chat routing is implemented.
- **Contact requests system** — `contacts_requests` table exists in schema but is not live. The `/contacts/request` route calls the SP but the notification mechanism is TBD.
- **Block/unblock** — `contacts_blocked_users` table exists in schema, no routes or UI exist yet.
- **Contact request approval** — No UI for pending/approved/rejected states.
