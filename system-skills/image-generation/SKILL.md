---
name: image-generation
description: Generate images from text descriptions using Google Nano Banana (Gemini Image API)
metadata: { "clawdbot": { "emoji": "🍌" } }
---

# Image Generation

**Generate images using Google's Nano Banana (Gemini Image API).**

## Requirements

- User must have **Google OAuth** linked to their persona
- If Google is not linked, direct the user to: **Settings → LLM Providers → Connect Google**

## Check Before Generating

Before generating images, check if the user has Google OAuth linked. If not, respond with:

> "To generate images, you need to connect your Google account first. Go to **Settings → LLM Providers → Connect Google** to link your account. This uses Google OAuth so you don't need to manage API keys manually."

## How to Generate Images

Use the `run` tool with the bundled nano-banana-pro script:

```
run command="uv run /app/openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt \"USER_PROMPT_HERE\" --filename \"/tmp/img-gen/output.png\" --resolution 1K"
```

**Important:** Always specify the full output path to know where images are saved.

## Parameters

| Parameter               | Options                                                                 | Default       |
| ----------------------- | ----------------------------------------------------------------------- | ------------- |
| `--resolution` / `-r`   | `1K`, `2K`, `4K`                                                        | `1K`          |
| `--aspect-ratio` / `-a` | `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` | model decides |
| `--input-image` / `-i`  | Path to input image(s) for editing                                      | none          |

## Example Commands

**Standard image:**

```
run command="uv run /app/openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt \"a cute cat wearing a wizard hat, digital art\" --filename \"/tmp/img-gen/cat-wizard.png\""
```

**High quality 4K landscape:**

```
run command="uv run /app/openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt \"mountain sunset, cinematic\" --filename \"/tmp/img-gen/sunset.png\" --resolution 4K --aspect-ratio 16:9"
```

**Portrait for social media:**

```
run command="uv run /app/openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt \"fashion portrait\" --filename \"/tmp/img-gen/portrait.png\" --aspect-ratio 9:16"
```

**Edit existing image:**

```
run command="uv run /app/openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt \"add a sunset background\" --filename \"/tmp/img-gen/edited.png\" -i \"/path/to/input.png\" --resolution 2K"
```

**Multi-image composition (up to 14 images):**

```
run command="uv run /app/openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt \"combine these into a collage\" --filename \"/tmp/img-gen/collage.png\" -i img1.png -i img2.png -i img3.png"
```

## Complete Workflow

1. **Generate the image:**

```
run command="uv run /app/openclaw/skills/nano-banana-pro/scripts/generate_image.py --prompt \"USER_PROMPT\" --filename \"/tmp/img-gen/image.png\""
```

2. **The script prints a MEDIA: line** - OpenClaw auto-attaches on supported chat providers

3. **For cloud sharing** - upload to cloud storage if needed

## Aspect Ratio Guidelines

| Use Case                          | Aspect Ratio   |
| --------------------------------- | -------------- |
| Square (Instagram, profile pics)  | `1:1`          |
| Portrait (Stories, TikTok, Reels) | `9:16`         |
| Landscape (YouTube thumbnails)    | `16:9`         |
| Cinematic                         | `21:9`         |
| Standard photo                    | `4:3` or `3:2` |

## Error Handling

**If Google OAuth not linked:**
Tell the user: "To generate images, please connect your Google account first. Go to **Settings → LLM Providers → Connect Google** to link your account via OAuth."

**If generation fails with authentication error:**
The user's Google OAuth token may have expired. Direct them to reconnect: "Your Google connection may have expired. Please go to **Settings → LLM Providers** and reconnect your Google account."

**If GEMINI_API_KEY not found and OAuth not available:**
Tell the user: "Image generation requires a Google account. Please connect your Google account in **Settings → LLM Providers → Connect Google**."
