---
name: media-studio
description: Ask the Clawku Media Studio for campaign images and for short clips cut from the owner's long videos — work is queued, not instant.
metadata: { "clawdbot": { "emoji": "🎨" } }
---

# Media Studio

Marketing media is made by the **Clawku Media Studio**, a GPU machine that pulls jobs from a
queue. You drive it with the **`media` command-line tool through your `bash` tool**. A job takes
minutes and the studio is not always awake, so **you never wait for a result inside a reply**.

**Run every action as a bash command:**
`node /app/openclaw/system-skills/media-studio/media.mjs <command> [args]`
(it auto-detects the persona from the workspace and prints one JSON line per result.)

Two things the studio does:

1. **Campaign images** — product posts, profile pictures, key visuals, rendered from your brief.
2. **Clipper** — the owner gives a long video (a talk, a demo, a podcast, a live session) and
   you cut short clips from it for Reels / TikTok / Shorts. Nothing is generated: the studio
   transcribes the video, you choose the moments, the studio cuts them, reframes to 9:16, burns
   captions and a hook title, and sends the clip back for approval.

## Commands

### Images

- `media.mjs request --title "<t>" --prompt "<scene direction>" [--product "<name>"] [--ref <url>]... [--aspect 4:5|1:1|9:16|16:9] [--caption "<c>"] [--notify whatsapp:<number>] [--notes "<n>"]`
  → `{"id":..., "status":"QUEUED", "position":N, "etaMinutes":M}`

### Clipper

- `media.mjs source add --title "<t>" --url <link>` — register a long video by link (YouTube,
  Google Drive, a direct mp4 link). Videos the owner uploads in the dashboard appear in `sources`
  by themselves. → `{"id": <sourceId>, ...}`
- `media.mjs sources` — the videos you can work from, with transcript status.
- `media.mjs transcribe <sourceId> [--lang id|en]` — queue the transcription (minutes, depends on
  length). The platform briefs you with `[TRANSCRIPT READY]` when it is done.
- `media.mjs transcript <sourceId> [--from mm:ss] [--to mm:ss] [--grep "<word>"]` — read the
  transcript as timestamped lines. Use `--from/--to` to page through a long video and `--grep`
  to find a topic.
- `media.mjs clip --source <sourceId> --start <s|mm:ss> --end <s|mm:ss> --title "<t>" [--hook "<overlay title>"] [--caption "<post caption>"] [--aspect 9:16] [--no-captions] [--notes "<n>"]`
  — queue ONE clip. `--hook` is the short line burned at the top of the video (the scroll-stopper,
  ≤ 60 characters); `--caption` is the post caption. Default aspect 9:16 with captions burned from
  the transcript. A clip is 1–180 s; aim for 15–60 s.

### Any job

- `media.mjs status <id>` — one job: status (QUEUED / CLAIMED / RENDERING / DONE / FAILED), review, resultUrl, caption, error
- `media.mjs list [--status DONE] [--kind clip] [--source <id>] [--limit 20]` — your jobs, newest first
- `media.mjs caption <id> "<caption>"` — store or update the post caption for a job
- `media.mjs approve <id>` / `media.mjs reject <id> "<note>"` — record the owner's decision
- `media.mjs posted <id> <postUrl>` — mark the media as published
- `media.mjs cancel <id>` — withdraw a job that has not finished

## How the image flow works

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

## How the clipper flow works

1. **Get the video in.** If the owner sends a link, `source add`. If they uploaded it in the
   dashboard (Company → Marketing → Studio), it is already in `sources`. Then `transcribe <id>`
   and tell the owner the transcript is being made (minutes; long videos take longer).
2. **Wait for `[TRANSCRIPT READY]`.** The platform sends it to you with the source id. Never
   poll in a loop and never guess timestamps before the transcript exists.
3. **Choose the moments.** Read `transcript <id>` (page with `--from/--to`, search with
   `--grep`). Pick 3–5 self-contained moments: one idea each, starting on a strong sentence,
   15–60 s, ending on a complete thought. Quote the `[mm:ss-mm:ss]` lines you chose.
4. **Queue the clips.** One `clip` per moment with `--title` (internal name), `--hook` (the
   on-screen opener, in the brand's language, ≤ 60 chars, no clickbait) and `--caption` (post
   caption with hashtags at the end). Report the queue to the owner: which moments, ids, ETAs.
   Cutting clips is internal work; publishing them is not — the owner approves each clip first.
5. **The platform delivers each clip** to the owner on WhatsApp with your caption and sends you
   `[MEDIA READY]`. Owner approval ("setuju <id>") → publish through the Instagram manager
   (`ig_post_ui.mjs` handles video files too) and `posted <id> <url>`. A revision → `reject` with
   the note, then a new `clip` with the corrected span / hook (mention the previous job id).
6. **Failures.** The platform tells the owner when a transcription or a cut fails (bad link,
   private video, span outside the video). Fix the cause and queue again.

## Running a campaign

- Plan first: list the posts (product, angle, caption, date) and agree it with the owner.
- Then one `request` per post, with `--product`, `--ref` for the real product photo, and the draft
  caption. Report the queue back with ids and ETAs.
- For a video the owner recorded, turn it into a week of clips: transcribe once, then one `clip`
  per moment, each with its own hook and caption; space the posts out.
- Keep captions in the brand's language and voice; hashtags at the end; no prices unless given.

## Notes

- Results are hosted by the platform (`resultUrl`, clips also have `thumbUrl`); feed that URL's file
  to `ig_post_ui.mjs` for publishing (see the flows) or `ig.mjs set-profile --pic` for profile
  pictures.
- `list --status DONE` shows what is waiting for a decision; `status <id>` answers "is it ready yet?".
