1. Use the `gh-issue` script located at `/usr/local/bin/gh-issue` — do NOT use `gh issue create`.
2. Call it with `requires_approval: false` so it runs immediately without waiting for terminal approval.
3. Do NOT run any demonstration, test, or example commands. Create only the issue specified above.
4. After running the command, check `/tmp/gh-issue-result` to confirm it worked, then show me the URL.
5. Do not ask me for confirmation before running it — just execute it.
6. **CRITICAL: After reading `/tmp/gh-issue-result`, immediately call `attempt_completion` with the issue URL. Do NOT perform any additional steps, checks, or verifications. The task is DONE once you have the URL.**