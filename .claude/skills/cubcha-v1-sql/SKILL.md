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

## Table Overview

| Table | Purpose |
|---|---|
| `user_main_details` | Core identity: `user_id` PK, `ldap_uid_id`, `display_name` |
| `user_main_details_disabled` | Purge queue — INSERT triggers cascade deletion, removes from `user_main_details` last |
| `banned_users` | Abuse prevention: HMAC-SHA256 email hashes, `ban_expires_at` (NULL = permanent) |
| `user_system_details` | Profile flags: `public_st`, `can_be_added_to_contacts`, timezone, language |
| `contacts` / `contacts_requests` / `contacts_blocked_users` | User relationships |
| `user_groups` / `group_members` | Group management |
| `conversations` / `conversations_participants` / `messages` | Core chat (messages denormalizes sender fields) |
| `archived_*` | Historical copies after deletion — no live FKs back |
| `timezones` | Reference table; FK target from `user_system_details` |

Full field-level detail: See [schema-reference.md](schema-reference.md)

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

## Not Yet Implemented (NYI)
- Trigger on INSERT into `user_main_details_disabled` to cascade user purge
- `conversations.group_id` FK to `user_groups` (noted in script as "not in live db yet")
- Full archiving pipeline activated by disabled-user trigger
