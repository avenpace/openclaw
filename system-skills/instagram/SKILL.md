---
name: instagram
description: Manage Instagram account via headless browser — post, reply, like, follow.
metadata: { "clawdbot": { "emoji": "📸" } }
---

# Instagram

Manage an Instagram account through a dedicated, isolated headless browser. You drive it by running
the **`ig` command-line tool with your `bash` tool** — post content, engage, and grow the audience
without manual browser interaction.

**Run every action as a bash command:**
`node /app/openclaw/system-skills/instagram/ig.mjs <command> [args]`
(it auto-detects the persona from the workspace and prints one JSON line per result.)

## Commands

- `ig.mjs check` — Verify login status → `{"loggedIn":true|false,"username":...}`
- `ig.mjs setup <username> <password> [otpSecret]` — Log in and persist the session (once; pass the OTP secret if 2FA is on)
- `ig.mjs post <imageUrl> "<caption>"` — Post a photo (requires an image URL — Instagram has no caption-only posts)
- `ig.mjs reply <postUrl> "<comment>"` — Comment on a post
- `ig.mjs like <postUrl>` — Like a post
- `ig.mjs follow <username>` — Follow a user
- `ig.mjs profile [username]` — Retrieve profile stats (own profile if omitted)

## Workflows

### First-time setup

1. Run `ig.mjs check`. If `loggedIn` is false, ask the owner (via WhatsApp) for the Instagram username,
   password, and OTP secret (if 2FA is enabled).
2. Run `ig.mjs setup <username> <password> [otpSecret]`. The session is stored and persists across restarts.
3. Run `ig.mjs check` again → expect `loggedIn:true`.

### Posting content (e.g. sent from WhatsApp)

1. The owner sends a caption and an image. Make sure you have a hosted `imageUrl`.
2. Run `ig.mjs post "<imageUrl>" "<caption>"`. On success the result JSON has `postUrl`.
3. Confirm to the owner with the returned `postUrl`.

### Engaging / growing

- Comment: `ig.mjs reply <postUrl> "<comment>"` · Like: `ig.mjs like <postUrl>` · Follow: `ig.mjs follow <username>`
- Check stats: `ig.mjs profile [username]`

## Notes

- Always `check` before acting; if the session expired, re-run `setup`.
- `post` needs a real `imageUrl`; caption-only posts are not supported by Instagram.
- Never print the password. Credentials are stored encrypted at rest.
