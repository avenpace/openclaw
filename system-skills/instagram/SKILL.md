---
name: instagram
description: Manage Instagram account via headless browser — post, reply, like, follow.
metadata: { "clawdbot": { "emoji": "📸" } }
---

# Instagram

Friday manages your Instagram account through a headless browser, enabling you to post content, engage with others via comments and likes, and grow your audience—all without manual browser interaction.

## First-Time Setup

To get started, share your Instagram username and password with Friday via WhatsApp. She’ll call `ig_setup` once to log in, store credentials securely in the browser session, and persist them across restarts—no need to re-enter login details later.

## Available Tools

- **ig_setup** username, password, otpSecret(optional) — Log in to Instagram and persist session
- **ig_check** — Verify current login status and active account
- **ig_post** caption, imageUrl(optional) — Post a photo with optional caption (requires `imageUrl` for actual image posts)
- **ig_reply** postUrl, comment — Comment on a specific post
- **ig_like** postUrl — Like a given post
- **ig_follow** username — Follow an Instagram user by handle
- **ig_profile** username(optional) — Retrieve profile stats (default: current user)

## Workflows

### Setting Up Instagram (First Time)
1. Share your Instagram credentials with Friday via WhatsApp.
2. Friday calls `ig_setup` with your username, password, and optional OTP secret (if 2FA is enabled).
3. Upon successful login, credentials are saved in the browser session and persist across restarts.

### Checking Login Status
1. Friday calls `ig_check` to confirm you’re logged in.
2. If not, she prompts re-authentication via `ig_setup`.

### Posting Content
1. Provide caption and path/URL to the image you’d like to post.
2. Friday calls `ig_post` with `caption` and `imageUrl`.
3. She verifies the post was published via `ig_check`.

### Engaging with Posts
1. Share the target post URL and your comment/like intent.
2. Friday calls `ig_reply` to add a comment, then `ig_like` to like the post.
3. She confirms engagement success and logs activity.

### Growing Audience
1. Identify target users (e.g., via `ig_profile` on competitors or suggested accounts).
2. Friday calls `ig_follow` to follow users of interest.
3. She periodically reviews follower growth and engagement via repeated `ig_profile` calls.

## Notes
- Sessions persist across restarts — login once, stays logged in
- `ig_post` requires an imageUrl to actually post a photo; caption-only posts are not supported by Instagram
- If login expires, use `ig_setup` again to re-authenticate
