---
name: cubcha-v1-sql
description: 'Review, modify, or extend the cubcha_v1 database schema (create_cubcha_v1.sql). Use when asked about table design, SQL syntax issues, user account lifecycle, GDPR/privacy concerns, ban logic, trigger planning, or any changes to the MariaDB schema for this chat application.'
argument-hint: 'Optional: specify a table or concern (e.g. banned_users, trigger design, GDPR)'
---

# CubCha V1 SQL Schema Skill

## File Location
`client/create_cubcha_v1.sql` — MySQL Workbench–authored schema, deployed to MariaDB on VPS.

## Engine & Charset
- `ENGINE=InnoDB` on all tables
- `DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci` everywhere
- Script opens with `FOREIGN_KEY_CHECKS=0` and `UNIQUE_CHECKS=0` for safe creation order

---

## Table Inventory

### `user_main_details`
Core user identity table. Source of truth for `user_id`.
- `user_id` SMALLINT UNSIGNED PK AUTO_INCREMENT
- `ldap_uid_id` VARCHAR(32) UNIQUE — LDAP login identifier, never shown to other users
- `display_name` VARCHAR(48) — only identity visible to other users in chat
- `last_seen_at` TIMESTAMP, `last_login_at` DATETIME

### `user_main_details_disabled`
**Purge queue table.** Inserted into when a user account is closed (by user or admin). A trigger (NYI) fires on INSERT to cascade-delete the user across all tables, then removes from `user_main_details` last.
- `user_id` SMALLINT UNSIGNED **PRIMARY KEY** — no surrogate key, 1:1 with `user_main_details`
- `disabled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `last_login_at` DATETIME — admin audit only
- **No FOREIGN KEY** to `user_main_details` — intentionally omitted. After the trigger completes, `user_id` becomes an orphaned reference, which is correct behavior for a purge queue.

### `banned_users`
Stores hashed identifiers of banned users to prevent re-registration abuse. Contains **no recoverable PII**.
- `ban_id` SMALLINT UNSIGNED PK AUTO_INCREMENT
- `email_hash` VARCHAR(64) NOT NULL — HMAC-SHA256 of email (requires server-side secret, not plain SHA-256)
- `ban_expires_at` DATETIME DEFAULT NULL — NULL = permanent ban, a date = temporary ban. Single source of truth; no redundant boolean needed.
- `banned_at` DATETIME DEFAULT CURRENT_TIMESTAMP
- `ban_reason` VARCHAR(255) — admin notes only, no PII
- UNIQUE KEY on `email_hash`

### `user_system_details`
Profile and settings. FK to `user_main_details` with CASCADE.
- `user_id` PK (no surrogate)
- Language, timezone (FK to `timezones`), max participants, public/private flags
- `created_at`, `updated_at` with ON UPDATE CURRENT_TIMESTAMP

### `contacts`, `contacts_requests`, `contacts_blocked_users`
User relationship tables. All FK to `user_main_details`.
- `contacts_requests` uses ENUM `('pending','approved','rejected','cancelled')` with a unique key on `(requester_user_id, target_user_id, status_st)` to allow new requests after resolution while blocking duplicate pending ones.

### `user_groups`, `group_members`
Group management. `user_groups.owner_user_id` FK to `user_main_details`.

### `conversations`, `conversations_participants`, `messages`
Core chat tables. `messages` denormalizes `sender_username` and `sender_avatar_url` for fast display without joins.

### Archived tables
`archived_conversations`, `archived_conversations_participants`, `archived_messages`, `archived_user_groups`, `archived_group_members` — mirror structure of live tables for historical retention after conversation/group deletion. No live FKs back to active tables in some cases.

### `timezones`
Reference table. `timezone_name` VARCHAR(64) UNIQUE. FK target from `user_system_details`.

---

## Key Design Decisions & Rationale

### `user_main_details_disabled` — why no FK and no surrogate PK
- A surrogate `dis_user_id AUTO_INCREMENT` was rejected: it allows duplicate rows for the same user, providing no constraint benefit in a 1:1 purge table. `user_id` as PK enforces one-record-per-user at DB level.
- FK omitted because after the trigger purges `user_main_details`, the reference becomes orphaned by design. No FK option (CASCADE, RESTRICT, SET NULL) fits the trigger flow without breaking it.
- **Trigger order must be:** INSERT into `user_main_details_disabled` → trigger fires → delete from all dependant tables → delete from `user_main_details` last.

### `banned_users` — separation of concerns from disabled table
- Two tables serve different purposes: `user_main_details_disabled` is a purge queue (privacy-neutral, all data deleted after trigger). `banned_users` is an abuse-prevention record (survives deletion intentionally, legitimate interest GDPR carve-out).
- Never conflate deletion with punishment — innocent user deletes get full erasure; only ban records persist.

### GDPR / Right to be Forgotten
- `display_name` must not be preserved in any archive for deleted users — it is personal data.
- `ldap_uid_id` is a login-only identifier, never visible to other users, so re-registration prevention is not justified — users may reuse their LDAP account freely.
- `email_hash` in `banned_users` is the proportionate identifier for abuse prevention. Must use **HMAC-SHA256 with a server-side secret** (not plain SHA-256) — email has low entropy and is vulnerable to rainbow tables without a secret.
- Document in privacy policy that `banned_users` hashed identifiers are retained under legitimate interest (abuse prevention), exempt from right to be forgotten requests.

### `ban_expires_at` as single source of truth for temporary bans
- A `temporary_ban BOOLEAN` column alongside `ban_expires_at` is redundant and creates desync risk (e.g. `temporary_ban=TRUE`, `ban_expires_at=NULL`). Use only `ban_expires_at`: NULL = permanent, a date value = temporary.

---

## Common Syntax Issues to Watch
- `DEFAULT NOT NULL` is invalid — `DEFAULT` requires a value. Use just `NOT NULL`.
- Informal notes with `*` outside string literals (e.g. `COMMENT '...'*might not be needed?`) cause syntax errors — use `-- comment` instead.
- A table can only have one `PRIMARY KEY`. Two columns both declared `PRIMARY KEY` is a fatal error.
- `UNIQUE KEY` referencing a column that is not defined in the table will fail silently or error on execution — always verify the column exists.
- `FOREIGN KEY ... ON DELETE CASCADE` on `user_main_details_disabled.user_id` would delete the purge record when the user is removed — wrong. FK intentionally omitted.

---

## Not Yet Implemented (NYI)
- Trigger on INSERT into `user_main_details_disabled` to cascade user purge
- `conversations.group_id` FK to `user_groups` (noted in script as "not in live db yet")
- Full archiving pipeline activated by disabled-user trigger
