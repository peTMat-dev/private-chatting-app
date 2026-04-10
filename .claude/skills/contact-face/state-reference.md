# Contact Face — State Reference

## Table of Contents
- State variables
- TypeScript types
- DB schema
- i18n keys
- CSS classes

---

## State Variables (`home/page.tsx` lines ~450–870)

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

// Per-row busy guards (prevents double-submit)
const [removingContactId, setRemovingContactId] = useState<number | null>(null);
const [removingPublicUserId, setRemovingPublicUserId] = useState<number | null>(null);
const [addingPublicUserId, setAddingPublicUserId] = useState<number | null>(null);

// Whose Contact Am I
const [whoseContactAmI, setWhoseContactAmI] = useState<{ id: number; displayName: string }[]>([]);
const [showWhoseContactAmI, setShowWhoseContactAmI] = useState(false);
const [loadingWhoseContactAmI, setLoadingWhoseContactAmI] = useState(false);
```

## TypeScript Types

```ts
type ContactItem = {
  id: number;
  displayName: string;
  status_st: boolean;
  addedAt: string;
  isPublic: boolean;  // false = private user (🔒 shown in Contact List)
};

type PublicUser = {
  id: number;
  displayName: string;
  isAlreadyContact: boolean;
};
```

---

## DB Schema (Relevant Tables)

```sql
-- contacts (live)
contacts (
  owner_user_id   SMALLINT UNSIGNED,
  contact_user_id SMALLINT UNSIGNED,
  status_st       BOOLEAN,          -- active/removed
  added_at        DATETIME
  PK: (owner_user_id, contact_user_id)
)

-- user_system_details (live, relevant fields)
user_system_details (
  user_id                    SMALLINT UNSIGNED PK,
  public_st                  BOOLEAN,  -- true = publicly visible profile
  can_be_added_to_contacts   BOOLEAN   -- true = appears in public user list
)

-- contacts_requests (schema exists, NYI in live)
contacts_requests (
  request_id        INT UNSIGNED PK AUTO_INCREMENT,
  requester_user_id SMALLINT UNSIGNED,
  target_user_id    SMALLINT UNSIGNED,
  status_st         ENUM('pending','approved','rejected','cancelled'),
  requested_at      DATETIME
)

-- contacts_blocked_users (schema exists, NYI in live)
contacts_blocked_users (
  blocker_user_id SMALLINT UNSIGNED,
  blocked_user_id SMALLINT UNSIGNED,
  blocked_at      DATETIME
  PK: (blocker_user_id, blocked_user_id)
)
```

**Note:** `public_st` in `user_system_details` is aliased as `public` in the TypeScript `UserSettings` type (settings route). Don't confuse them.

---

## i18n Keys

All strings via `t(lang)` from `lib/i18n.ts`. Always check for existing keys before adding; update all 6 languages (`en`, `es`, `fr`, `de`, `sk`, `cs`).

| Key | Usage |
|---|---|
| `tr.contacts` | Section heading |
| `tr.addPublicUser` | "Public User" toggle button |
| `tr.loadingUsers` | Spinner text (public list + whose-contact-am-i) |
| `tr.noPublicUsers` | Empty state for public user list |
| `tr.requestByName` | "Request by Name" toggle button |
| `tr.enterDisplayName` | Placeholder for private request input |
| `tr.privateRequestSent` | Neutral confirmation after sending request |
| `tr.contactList` | "☰ Contact List" toggle button (`☰` hardcoded in JSX) |
| `tr.noContactsYet` | Empty state for contact list |
| `tr.couldNotLoadContacts` | Error state for contact list |
| `tr.chatSoon` | Tooltip for disabled chat button |
| `tr.whoseContactAmI` | "Whose Contact Am I?" toggle button |

---

## CSS Classes

| Class | Usage |
|---|---|
| `add-contact-btn` | Full-width section toggle buttons |
| `sort-btn` | A-Z / Z-A sort and search clear buttons |
| `sort-btn active` | Active sort direction |
| `contact-action-btn` | Base for per-row action buttons |
| `contact-action-btn--add` | Green add/check button |
| `contact-action-btn--remove` | Red/muted remove button |
| `contact-action-btn--chat` | Chat icon button (currently disabled) |
| `auth-input` | Scrollable list container (`maxHeight: "180px"`, `overflowY: "auto"`) |
