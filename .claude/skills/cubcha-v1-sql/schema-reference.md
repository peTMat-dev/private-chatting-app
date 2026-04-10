# CubCha V1 Schema — Table Reference

## Contents
- user_main_details
- user_main_details_disabled
- banned_users
- user_system_details
- contacts / contacts_requests / contacts_blocked_users
- user_groups / group_members
- conversations / conversations_participants / messages
- Archived tables
- timezones

---

## `user_main_details`

Core identity. Source of truth for `user_id`.

| Column | Type | Notes |
|---|---|---|
| `user_id` | SMALLINT UNSIGNED PK AUTO_INCREMENT | |
| `ldap_uid_id` | VARCHAR(32) UNIQUE | LDAP login ID — never shown to other users |
| `display_name` | VARCHAR(48) | Only identity visible to others |
| `last_seen_at` | TIMESTAMP | |
| `last_login_at` | DATETIME | |

---

## `user_main_details_disabled`

Purge queue. INSERT → trigger (NYI) cascades user deletion across all tables, then deletes from `user_main_details` last.

| Column | Type | Notes |
|---|---|---|
| `user_id` | SMALLINT UNSIGNED PK | No surrogate key; enforces 1:1 |
| `disabled_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | |
| `last_login_at` | DATETIME | Admin audit only |

No FK to `user_main_details` — intentional; reference becomes orphaned after trigger.

---

## `banned_users`

Abuse prevention. No recoverable PII.

| Column | Type | Notes |
|---|---|---|
| `ban_id` | SMALLINT UNSIGNED PK AUTO_INCREMENT | |
| `email_hash` | VARCHAR(64) NOT NULL UNIQUE | HMAC-SHA256 (requires server-side secret) |
| `ban_expires_at` | DATETIME DEFAULT NULL | NULL = permanent; date = temporary |
| `banned_at` | DATETIME | |
| `ban_reason` | VARCHAR(255) | Admin notes only |

---

## `user_system_details`

Profile and settings. FK → `user_main_details` CASCADE.

| Column | Notes |
|---|---|
| `user_id` | PK (no surrogate) |
| `language` | UI language |
| `timezone_id` | FK → `timezones` |
| `public_st` | Profile publicly visible |
| `can_be_added_to_contacts` | Appears in public user list |
| `created_at` / `updated_at` | `updated_at` has ON UPDATE CURRENT_TIMESTAMP |

---

## contacts / contacts_requests / contacts_blocked_users

User relationship tables. All FK → `user_main_details`.

`contacts_requests` uses `ENUM('pending','approved','rejected','cancelled')` with a UNIQUE key on `(requester_user_id, target_user_id, status_st)` — allows new requests after resolution while blocking duplicate pending ones.

---

## user_groups / group_members

Group management. `user_groups.owner_user_id` FK → `user_main_details`.

---

## conversations / conversations_participants / messages

Core chat. `messages` denormalizes `sender_username` and `sender_avatar_url` for fast display without joins.

---

## Archived tables

`archived_conversations`, `archived_conversations_participants`, `archived_messages`, `archived_user_groups`, `archived_group_members` — mirror structure of live tables. Populated when conversations/groups are deleted. No live FKs back to active tables in some cases.

---

## timezones

Reference table. `timezone_name` VARCHAR(64) UNIQUE. FK target from `user_system_details`.
