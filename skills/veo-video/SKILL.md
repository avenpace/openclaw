---
name: veo-video
description: Generate videos from text or images using Google Veo 3.1 API
homepage: https://ai.google.dev/
metadata:
  {
    "openclaw":
      {
        "emoji": "🎬",
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"] },
        "primaryEnv": "GEMINI_API_KEY",
        "install":
          [
            {
              "id": "uv-brew",
              "kind": "brew",
              "formula": "uv",
              "bins": ["uv"],
              "label": "Install uv (brew)",
            },
          ],
      },
  }
---

# Veo Video Generation (Google Veo 3.1)

Use the bundled script to generate videos from text prompts or images.

## Text-to-Video

```bash
uv run {baseDir}/scripts/generate_video.py --prompt "a sunset timelapse over mountains" --filename "output.mp4" --duration 5
```

## Image-to-Video

```bash
uv run {baseDir}/scripts/generate_video.py --prompt "animate this scene with gentle wind" --filename "output.mp4" --input-image "/path/to/image.png"
```

## Parameters

| Parameter                  | Options                 | Default |
| -------------------------- | ----------------------- | ------- |
| `--duration` / `-d`        | `5`, `10` (seconds)     | `5`     |
| `--aspect-ratio` / `-a`    | `16:9`, `9:16`, `1:1`   | `16:9`  |
| `--resolution` / `-r`      | `720p`, `1080p`, `4K`   | `1080p` |
| `--negative-prompt` / `-n` | What to avoid           | none    |
| `--input-image` / `-i`     | Path for image-to-video | none    |

## API Key

- `GEMINI_API_KEY` env var
- Or set `skills."veo-video".apiKey` / `skills."veo-video".env.GEMINI_API_KEY` in `~/.openclaw/openclaw.json`

## Aspect Ratio Guide

| Use Case                 | Aspect Ratio |
| ------------------------ | ------------ |
| YouTube, landscape video | `16:9`       |
| TikTok, Reels, Shorts    | `9:16`       |
| Square (Instagram feed)  | `1:1`        |

## Examples

**Landscape cinematic video:**

```bash
uv run {baseDir}/scripts/generate_video.py --prompt "epic drone shot over a waterfall in iceland, cinematic, golden hour" --filename "/tmp/video/waterfall.mp4" --duration 10 --resolution 4K --aspect-ratio 16:9
```

**Vertical video for social media:**

```bash
uv run {baseDir}/scripts/generate_video.py --prompt "fashion model walking in slow motion, studio lighting" --filename "/tmp/video/fashion.mp4" --duration 5 --aspect-ratio 9:16
```

**Animate an image:**

```bash
uv run {baseDir}/scripts/generate_video.py --prompt "make the clouds move slowly across the sky" --filename "/tmp/video/animated.mp4" --input-image "/tmp/sky-photo.png" --duration 5
```

**With negative prompt:**

```bash
uv run {baseDir}/scripts/generate_video.py --prompt "peaceful forest scene" --filename "/tmp/video/forest.mp4" --negative-prompt "people, text, watermarks, blur"
```

## Notes

- Video generation takes 1-5 minutes depending on duration and resolution
- The script prints a `MEDIA:` line for OpenClaw to auto-attach on supported chat providers
- Do not read the video back; report the saved path only
- For best results, use detailed prompts with style and mood descriptions
