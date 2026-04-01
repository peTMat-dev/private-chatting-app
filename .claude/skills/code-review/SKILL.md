---
name: code-review
description: 'Review code in this project for bugs, security issues, and best practices. Use when asked to review, audit, or check code quality. Covers TypeScript, Next.js (React), Express.js, LDAP service, and MariaDB/MySQL query patterns used in this private chat application.'
argument-hint: 'Optional: specify a file or area to review (e.g. auth routes, LDAP service)'
---

# Code Review Skill

## When to Use
- User asks to review, audit, or check a file or feature
- Spotting bugs, security vulnerabilities, or bad patterns
- Reviewing a PR or a set of changes
- Checking API routes, services, or frontend components

## Stack Context
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Bootstrap 5
- **Backend**: Express.js 5, TypeScript, Node.js
- **Auth/Directory**: LDAP via `ldapts` library (not `ldapjs`) in `ldap.service.ts`
- **Password hashing**: `argon2` (server-side)
- **Database**: MariaDB on VPS (MySQL-compatible; scripts authored in MySQL Workbench, accessed via `mysql` npm package in `db.ts`)
- **Monorepo**: `client/` (Next.js) + `server/` (Express)

## Review Checklist

### Security (OWASP Top 10)
- [ ] No SQL injection — use parameterized queries with `?` placeholders (`query('SELECT ... WHERE id = ?', [id])`)
- [ ] No LDAP injection — sanitize all LDAP filter inputs (current code interpolates `email`/`uid` directly into filter strings — high risk)
- [ ] Auth checks on every protected route (session/token validation)
- [ ] Passwords never logged or returned in responses
- [ ] CORS origin restricted to known clients (`env.app.clientOrigins`)
- [ ] No sensitive data in error messages returned to client
- [ ] Input validated at API boundary before processing

### TypeScript / Code Quality
- [ ] No `any` types unless justified
- [ ] Async/await with proper error handling (`try/catch`)
- [ ] No unhandled promise rejections
- [ ] Consistent use of `env.ts` for config — no hardcoded secrets or URLs

### Express Routes (`server/src/routes/`)
- [ ] Route handlers delegate logic to services, not inline business logic
- [ ] HTTP status codes are appropriate (400 for client errors, 500 for server errors)
- [ ] Request body/params validated before use

### Next.js Components (`client/src/`)
- [ ] `"use client"` only where needed (avoid overuse)
- [ ] No secrets or server-only logic in client components
- [ ] API calls go through `lib/api.ts` helpers, not raw `fetch` with hardcoded URLs

### Database (`services/db.ts`)
- [ ] Parameterized queries only — never string-concatenated SQL (MySQL uses `?` placeholders)
- [ ] Connection pool used correctly — connections from `getConnection()` must be released after use
- [ ] `queryWithConnection` used inside transactions, not bare `query()`

## Procedure

1. **Identify scope** — which file(s) or feature to review
2. **Read the code** — use Read/Grep tools to load relevant files
3. **Check against checklist above** — note issues by category
4. **Report findings** — group by severity: Critical, Warning, Suggestion
5. **Propose fixes** — show corrected code snippets for each issue

## Output Format

```
## Code Review: <file or feature>

### Critical
- [issue] — [why it matters] — [fix]

### Warning
- [issue] — [why it matters] — [fix]

### Suggestion
- [issue] — [improvement]

### Summary
Overall assessment in 1-2 sentences.
```
