---
name: media-studio
description: Ask the Clawku Media Studio for campaign images (product posts, profile pictures) — renders are queued, not instant.
metadata: { "clawdbot": { "emoji": "🎨" } }
---

# Media Studio

Images are made by the **Clawku Media Studio**, a GPU machine that pulls jobs from a queue. You
drive it with the **`media` command-line tool through your `bash` tool**. A render takes minutes
and the studio is not always awake, so **you never wait for a result inside a reply**.

**Run every action as a bash command:**
`node /app/openclaw/system-skills/media-studio/media.mjs <command> [args]`
(it auto-detects the persona from the workspace and prints one JSON line per result.)

## Commands

- `media.mjs request --title "<t>" --prompt "<scene direction>" [--product "<name>"] [--ref <url>]... [--aspect 4:5|1:1|9:16|16:9] [--caption "<c>"] [--notify whatsapp:<number>] [--notes "<n>"]`
  → `{"id":..., "status":"QUEUED", "position":N, "etaMinutes":M}`
- `media.mjs status <id>` — one job: status (QUEUED / CLAIMED / RENDERING / DONE / FAILED), review, resultUrl, caption, error
- `media.mjs list [--status DONE] [--limit 20]` — your jobs, newest first
- `media.mjs caption <id> "<caption>"` — store or update the post caption for a job
- `media.mjs approve <id>` / `media.mjs reject <id> "<note>"` — record the owner's decision
- `media.mjs posted <id> <postUrl>` — mark the image as published
- `media.mjs cancel <id>` — withdraw a job that has not finished

## How the flow works

1. **Request.** One `request` per image. `--prompt` is the scene direction (setting, mood, light,
   framing); `--product` names the product exactly as the brand does; `--ref` points at product
   photos the studio must stay faithful to; `--caption` is your draft caption. Default `--aspect`
   is 4:5 (Instagram feed); use 1:1 for a profile picture, 9:16 for stories.
2. **Tell the owner it is queued.** Quote the job id and the ETA. Never pretend to wait, never
   invent a URL, never say the image is done before the platform says so.
3. **The platform delivers the result.** When a render finishes, the platform itself sends the
   image and your draft caption to the owner on WhatsApp, and sends you a `[MEDIA READY]` message
   with the job id and `resultUrl`. You do not need to resend the image.
4. **Owner decides.** "setuju <id>" (or any clear approval) → download the `resultUrl` image
   to a temp file, write the approved caption to a temp file, and publish with the Instagram
   manager's gated executor:
   `node /app/openclaw/system-skills/instagram-manager/ig_post_ui.mjs <image> <caption-file>`
   (one post per owner command; it enforces the ≥3 h spacing, warning lock and AI label —
   obey its `RESULT …` line, never retry a failure). Then `media.mjs posted <id> <postUrl>`
   and confirm the post link. A revision request → `media.mjs reject <id> "<note>"`,
   then a new `request` that carries the change in `--notes` (mention the previous job id).
   Do NOT post via the legacy `ig.mjs post` — it is retired for publishing on this account.
5. **Failures.** The platform tells the owner when a render fails; offer a different direction and
   `request` again.

## Running a campaign

- Plan first: list the posts (product, angle, caption, date) and agree it with the owner.
- Then one `request` per post, with `--product`, `--ref` for the real product photo, and the draft
  caption. Report the queue back with ids and ETAs.
- Keep captions in the brand's language and voice; hashtags at the end; no prices unless given.

## Notes

- Results are hosted by the platform (`resultUrl`); feed that URL's image to
  `ig_post_ui.mjs` for publishing (see step 4) or `ig.mjs set-profile --pic` for profile
  pictures.
- `list --status DONE` shows what is waiting for a decision; `status <id>` answers "is it ready yet?".
