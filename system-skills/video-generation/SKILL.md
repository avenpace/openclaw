---
name: video-generation
description: Generate videos from text or images using Google Veo 3.1 API
metadata: { "clawdbot": { "emoji": "🎬" } }
---

# Video Generation

**Generate videos using Google's Veo 3.1 API.**

## Requirements

- User must have **Google OAuth** linked to their persona
- If Google is not linked, direct the user to: **Settings → LLM Providers → Connect Google**

## Check Before Generating

Before generating videos, check if the user has Google OAuth linked. If not, respond with:

> "To generate videos, you need to connect your Google account first. Go to **Settings → LLM Providers → Connect Google** to link your account. This uses Google OAuth so you don't need to manage API keys manually."

## How to Generate Videos

Use the `run` tool with the bundled veo-video script:

```
run command="uv run /app/openclaw/skills/veo-video/scripts/generate_video.py --prompt \"USER_PROMPT_HERE\" --filename \"/tmp/video/output.mp4\" --duration 5"
```

**Important:** Always specify the full output path to know where videos are saved.

## Parameters

| Parameter                  | Options                | Default |
| -------------------------- | ---------------------- | ------- |
| `--duration` / `-d`        | `5`, `10` (seconds)    | `5`     |
| `--aspect-ratio` / `-a`    | `16:9`, `9:16`, `1:1`  | `16:9`  |
| `--resolution` / `-r`      | `720p`, `1080p`, `4K`  | `1080p` |
| `--input-image` / `-i`     | Path to starting image | none    |
| `--negative-prompt` / `-n` | What to avoid          | none    |

## Example Commands

**Standard landscape video:**

```
run command="uv run /app/openclaw/skills/veo-video/scripts/generate_video.py --prompt \"ocean waves crashing on a beach at sunset, cinematic\" --filename \"/tmp/video/ocean.mp4\" --duration 5"
```

**Vertical video for TikTok/Reels:**

```
run command="uv run /app/openclaw/skills/veo-video/scripts/generate_video.py --prompt \"fashion model walking in slow motion\" --filename \"/tmp/video/fashion.mp4\" --duration 5 --aspect-ratio 9:16"
```

**High quality 4K cinematic:**

```
run command="uv run /app/openclaw/skills/veo-video/scripts/generate_video.py --prompt \"epic drone shot over mountains at golden hour\" --filename \"/tmp/video/mountains.mp4\" --duration 10 --resolution 4K"
```

**Image-to-video (animate a still image):**

```
run command="uv run /app/openclaw/skills/veo-video/scripts/generate_video.py --prompt \"make the clouds drift slowly across the sky\" --filename \"/tmp/video/animated.mp4\" --input-image \"/tmp/img-gen/landscape.png\" --duration 5"
```

**With negative prompt:**

```
run command="uv run /app/openclaw/skills/veo-video/scripts/generate_video.py --prompt \"serene forest scene\" --filename \"/tmp/video/forest.mp4\" --negative-prompt \"people, text, watermarks, blur\""
```

## Aspect Ratio Guidelines

| Use Case                                | Aspect Ratio |
| --------------------------------------- | ------------ |
| YouTube, landscape content              | `16:9`       |
| TikTok, Instagram Reels, YouTube Shorts | `9:16`       |
| Square (Instagram feed)                 | `1:1`        |

## Complete Workflow

### Text-to-Video:

```
run command="uv run /app/openclaw/skills/veo-video/scripts/generate_video.py --prompt \"USER_PROMPT\" --filename \"/tmp/video/output.mp4\" --duration 5"
```

### Image-to-Video (workflow with Nano Banana):

1. **First generate an image:**

```
run command="uv run /app/openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt \"beautiful mountain landscape\" --filename \"/tmp/img-gen/mountain.png\""
```

2. **Then animate it:**

```
run command="uv run /app/openclaw/skills/veo-video/scripts/generate_video.py --prompt \"gentle wind moving through the scene, birds flying\" --filename \"/tmp/video/mountain-animated.mp4\" --input-image \"/tmp/img-gen/mountain.png\""
```

## Notes

- Video generation takes 1-5 minutes depending on duration and resolution
- The script prints a `MEDIA:` line - OpenClaw auto-attaches on supported chat providers
- For best results, use detailed prompts with style, mood, and camera movement descriptions
- Longer videos (10s) take longer to generate but provide more content

## Error Handling

**If Google OAuth not linked:**
Tell the user: "To generate videos, please connect your Google account first. Go to **Settings → LLM Providers → Connect Google** to link your account via OAuth."

**If generation fails with authentication error:**
The user's Google OAuth token may have expired. Direct them to reconnect: "Your Google connection may have expired. Please go to **Settings → LLM Providers** and reconnect your Google account."

**If GEMINI_API_KEY not found and OAuth not available:**
Tell the user: "Video generation requires a Google account. Please connect your Google account in **Settings → LLM Providers → Connect Google**."

**If generation times out:**
Video generation can take up to 10 minutes for complex prompts. If it times out, try:

- Shorter duration (5s instead of 10s)
- Lower resolution (1080p instead of 4K)
- Simpler prompt
