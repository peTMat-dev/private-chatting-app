---
name: client-server
description: 'Manage, debug, and modify the client (Next.js) and server (Express) in this monorepo VPS deployment. Use when asked to install packages, fix runtime errors, update dependencies, or modify shared state/API logic.'
argument-hint: 'Optional: specify area (e.g. client packages, server routes, contact logic, cube navigation)'
---

# Client & Server Skill

## Project Structure

```
/var/www/chatapp/private-chatting-app/   ← monorepo root (git root is inside client/)
  package.json                           ← root-level deps: argon2, bootstrap, ldapjs (pre-existing, do NOT remove)
  pnpm-lock.yaml                         ← root lockfile — tracked by git at client/ level
  node_modules/                          ← root node_modules (pre-existing, do NOT delete)
  client/                                ← Next.js app (git root here)
    package.json
    pnpm-lock.yaml
    next.config.ts
    src/
      app/home/page.tsx                  ← main cube UI (all faces: chats, contacts, settings)
      lib/api.ts                         ← fetch helpers: buildApiUrl(), postJson()
      lib/i18n.ts                        ← all UI strings (multi-language)
      lib/useCubeNavigation.ts           ← cube touch/keyboard navigation hook
  server/
    package.json
    src/
      routes/contacts.ts                 ← all contact CRUD routes
      routes/auth.ts
      routes/chats.ts
      routes/settings.ts
      services/db.ts
      services/ldap.service.ts
```

## Monorepo Layout — Critical Facts

- The **git repository root is inside `client/`**, not the monorepo root. Git commands (`git checkout`, `git show`, `git diff`) must be run from `client/`.
- The monorepo root `package.json` contains `argon2`, `bootstrap`, `ldapjs` — these were **pre-existing**, not added by mistake. Do NOT remove them.
- `pnpm-workspace.yaml` at the monorepo root is **gitignored** but pre-existing. Do NOT delete it — it defines the pnpm workspace that symlinks client packages from the shared `.pnpm` store.
- Because pnpm symlinks packages from the root `.pnpm` store into `client/node_modules`, Turbopack's `root` in `next.config.ts` must point to the **monorepo root** (one level up from `client/`): `root: path.resolve(process.cwd(), '..')`.

## Package Management Rules

- **Always `cd` into the correct directory before running `pnpm` commands.**
  - Client packages → `cd client/ && pnpm add <pkg> -D`
  - Server packages → `cd server/ && pnpm add <pkg>`
  - Never run `pnpm add` from the monorepo root unless the package belongs to the root `package.json`.
- To update a single package without upgrading everything: `pnpm add <pkg>@<version> -D` (NOT `pnpm update --latest` — this upgrades ALL packages including Next.js, TypeScript, ESLint major versions, which causes breakage).
- After restoring a `pnpm-lock.yaml` from git, run `pnpm install` then `pnpm add <only-the-target-package>@<version>`.
- `pnpm approve-builds` with no selection adds packages to `ignoredBuiltDependencies` — this blocks `argon2` native compilation. If accidentally triggered, remove the entry from `pnpm-workspace.yaml`.

## Known Dependency Notes

- `baseline-browser-mapping` — dev dep in `client/`. The warning "data is over two months old" is about the **data timestamp inside the package**, not the version. Even the latest version shows this warning. It is harmless.
- `argon2` — requires native build scripts. `server/package.json` has `"pnpm": { "onlyBuiltDependencies": ["argon2"] }` to ensure it compiles on clean installs. Must NOT be in `ignoredBuiltDependencies`.
- `ldapjs` is deprecated — the server uses `ldapts` instead. The root `package.json` still lists `ldapjs` as a pre-existing dep; ignore the deprecation warning.

## Client Architecture (Next.js)

- App Router, all pages under `src/app/`.
- Main UI is a **3D CSS cube** in `src/app/home/page.tsx`:
  - **Front face**: Chats list
  - **Left face**: Contacts (public user add/remove, request by name, contact list, whose-contact-am-I)
  - **Back face**: User Settings
  - **Right face**: Chat view (placeholder)
  - **Top face**: Logout
- Navigation is handled by `useCubeNavigation.ts` (touch swipes + keyboard arrows).
- All API calls use `buildApiUrl()` and `postJson()` from `lib/api.ts` — never raw hardcoded URLs.
- All UI strings come from `lib/i18n.ts` — check for existing keys before adding new ones.

## Server Architecture (Express)

- Routes in `server/src/routes/` — each file handles one domain (contacts, chats, auth, settings).
- DB access via `query()` from `services/db.ts` — always parameterized (`?` placeholders).
- Stored procedures used for contact operations: `CALL contact_2lookup_public_user(?)`, `CALL contact_2add_public_user(?, ?)`, `CALL contact_list_2remove_user(?, ?)`, `CALL contact_whose_contact_am_I(?)`.
- MySQL stored procedures return results in a nested array — always unwrap: `const rows = Array.isArray(result[0]) ? result[0] : result`.

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| Running `pnpm add` from monorepo root instead of `client/` or `server/` | Always `cd` to the right package first |
| `pnpm update --latest` — upgrades ALL packages | Use `pnpm add <pkg>@<version>` for targeted updates |
| Deleting `pnpm-workspace.yaml` | It's gitignored but real — restoring it requires knowing its original content |
| Deleting root `node_modules/` | Pre-existing, required by monorepo pnpm setup |
| Optimistic UI removal of a button before API completes | Use disabled state + loading indicator, update state only after API success |
| Adding `ignoredBuiltDependencies: [argon2]` | Blocks native build — remove from `pnpm-workspace.yaml` if present |
| `pnpm update --latest` touching Next.js major version | Next.js 16.2+ changed Turbopack workspace root inference, breaking monorepo setups |
