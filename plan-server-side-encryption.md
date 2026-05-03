# Plan: Server-Side Message Encryption (AES-256-GCM)

## Goal

Encrypt all chat messages at rest in the database using AES-256-GCM.  
Messages are currently stored as plaintext in `messages.message_text`.  
This protects against DB dumps and unauthorized DB access.

> **Note:** This is server-side encryption — the server holds the key and can read messages.  
> It is NOT end-to-end encryption. That is a separate future concern.

---

## Scope

- **Included:** Encrypt `message_text` before INSERT, decrypt after SELECT
- **Excluded:** Per-user keys, per-chat keys, E2E encryption, SRP login, key rotation
- **DB schema:** No changes — `message_text TEXT` holds the base64 ciphertext blob
- **New dependencies:** None — uses Node.js built-in `crypto` module
- **Client changes:** None

---

## Encryption Design

- Algorithm: **AES-256-GCM**
- Key: 32-byte random hex, stored in `.env` as `ENCRYPTION_KEY`
- Per-message random IV (12 bytes) — ensures ciphertext uniqueness even for identical messages
- Stored format in `message_text`: `base64(iv):base64(authTag):base64(ciphertext)` (single string)

---

## Files to Change

| File | Change |
|------|--------|
| `server/.env` | Add `ENCRYPTION_KEY=<32-byte hex>` |
| `server/src/config/env.ts` | Validate and export `ENCRYPTION_KEY` |
| `server/src/services/crypto.service.ts` *(new)* | `encryptText()` / `decryptText()` helpers |
| `server/src/routes/chats.ts` | Encrypt on INSERT, decrypt on SELECT |

---

## Implementation Steps

### 1. Generate the key

Run once to generate a secure key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add to `server/.env`:
```
ENCRYPTION_KEY=<output from above>
```

---

### 2. Validate key in env config

`server/src/config/env.ts` — add:
```typescript
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY ?? (() => {
  throw new Error("ENCRYPTION_KEY is not set");
})();
```

---

### 3. Create `crypto.service.ts`

`server/src/services/crypto.service.ts`:
```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { ENCRYPTION_KEY } from "../config/env";

const KEY = Buffer.from(ENCRYPTION_KEY, "hex"); // 32 bytes

export function encryptText(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptText(ciphertext: string): string {
  const [ivB64, authTagB64, encryptedB64] = ciphertext.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
```

---

### 4. Encrypt on INSERT

`server/src/routes/chats.ts` — `POST /chats/:id/messages`:
```typescript
// Before:
INSERT INTO messages (..., message_text, ...) VALUES (?, ?, ?, ?, NOW())
[conversationId, userId, username, text.trim()]

// After:
import { encryptText } from "../services/crypto.service";
...
INSERT INTO messages (..., message_text, ...) VALUES (?, ?, ?, ?, NOW())
[conversationId, userId, username, encryptText(text.trim())]
```

The socket emit payload uses the original `text` variable (before INSERT), so **no change needed** for real-time delivery.

---

### 5. Decrypt on SELECT

`server/src/routes/chats.ts` — `GET /chats/:id/messages`:
```typescript
// After query:
import { decryptText } from "../services/crypto.service";
...
const result = messages.map(m => ({
  ...m,
  message_text: decryptText(m.message_text)
}));
return res.json(result);
```

---

## Verification

1. Send a message via the app
2. Check the DB directly:
   ```sql
   SELECT message_text FROM messages ORDER BY message_id DESC LIMIT 1;
   ```
   Should show a base64 ciphertext blob — **not** readable text
3. Open the chat in the browser — messages should display correctly (server decrypts before serving)
4. Send a message to another user — real-time socket delivery should show readable text

---

## Future Work (out of scope)

- **SRP login** — eliminate plaintext password transmission to server
- **E2E encryption** — client-side ECDH key pairs, server never sees plaintext (would replace this layer)
- **Key rotation** — re-encrypt all rows with a new key
