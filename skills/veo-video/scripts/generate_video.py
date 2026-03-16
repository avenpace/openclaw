#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# dependencies = [
#     "google-genai>=1.0.0",
#     "pillow>=10.0.0",
# ]
# ///
"""
Generate videos using Google's Veo 3.1 API.

Usage:
    uv run generate_video.py --prompt "your video description" --filename "output.mp4" [--duration 5|10] [--aspect-ratio 16:9|9:16|1:1]

Image-to-video:
    uv run generate_video.py --prompt "animate this scene" --filename "output.mp4" --input-image "/path/to/image.png"
"""

import argparse
import os
import sys
import time
from pathlib import Path

SUPPORTED_ASPECT_RATIOS = ["16:9", "9:16", "1:1"]
SUPPORTED_DURATIONS = [5, 10]


def get_api_key(provided_key: str | None) -> str | None:
    """Get API key from argument first, then environment."""
    if provided_key:
        return provided_key
    return os.environ.get("GEMINI_API_KEY")


def main():
    parser = argparse.ArgumentParser(
        description="Generate videos using Google Veo 3.1"
    )
    parser.add_argument(
        "--prompt", "-p",
        required=True,
        help="Video description/prompt"
    )
    parser.add_argument(
        "--filename", "-f",
        required=True,
        help="Output filename (e.g., sunset-timelapse.mp4)"
    )
    parser.add_argument(
        "--input-image", "-i",
        dest="input_image",
        metavar="IMAGE",
        help="Input image path for image-to-video generation"
    )
    parser.add_argument(
        "--duration", "-d",
        type=int,
        choices=SUPPORTED_DURATIONS,
        default=5,
        help="Video duration in seconds: 5 or 10 (default: 5)"
    )
    parser.add_argument(
        "--aspect-ratio", "-a",
        choices=SUPPORTED_ASPECT_RATIOS,
        default="16:9",
        help=f"Video aspect ratio (default: 16:9). Options: {', '.join(SUPPORTED_ASPECT_RATIOS)}"
    )
    parser.add_argument(
        "--resolution", "-r",
        choices=["720p", "1080p", "4K"],
        default="1080p",
        help="Video resolution (default: 1080p)"
    )
    parser.add_argument(
        "--api-key", "-k",
        help="Gemini API key (overrides GEMINI_API_KEY env var)"
    )
    parser.add_argument(
        "--negative-prompt", "-n",
        help="What to avoid in the video"
    )

    args = parser.parse_args()

    # Import here to avoid slow import on error
    from google import genai
    from google.genai import types

    # Try to initialize client - OAuth/ADC first, then API key
    api_key = get_api_key(args.api_key)
    client = None

    if api_key:
        # Use explicit API key
        client = genai.Client(api_key=api_key)
        print("Using API key authentication")
    else:
        # Try OAuth/Application Default Credentials
        try:
            client = genai.Client()  # Uses ADC automatically
            print("Using OAuth/Application Default Credentials")
        except Exception as e:
            print("Error: No authentication available.", file=sys.stderr)
            print("Please connect your Google account:", file=sys.stderr)
            print("  Go to Settings → LLM Providers → Connect Google", file=sys.stderr)
            print("", file=sys.stderr)
            print("Or provide an API key:", file=sys.stderr)
            print("  1. --api-key argument", file=sys.stderr)
            print("  2. GEMINI_API_KEY environment variable", file=sys.stderr)
            sys.exit(1)

    # Set up output path
    output_path = Path(args.filename)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Load input image if provided (for image-to-video)
    input_image = None
    if args.input_image:
        from PIL import Image as PILImage
        try:
            with PILImage.open(args.input_image) as img:
                input_image = img.copy()
            print(f"Loaded input image: {args.input_image}")
        except Exception as e:
            print(f"Error loading input image '{args.input_image}': {e}", file=sys.stderr)
            sys.exit(1)

    # Build generation config
    generation_config = {
        "video_length_seconds": args.duration,
        "aspect_ratio": args.aspect_ratio,
    }

    if args.negative_prompt:
        generation_config["negative_prompt"] = args.negative_prompt

    # Map resolution to Veo parameter
    resolution_map = {
        "720p": "720p",
        "1080p": "1080p",
        "4K": "4k",
    }
    generation_config["resolution"] = resolution_map.get(args.resolution, "1080p")

    print(f"Generating {args.duration}s video at {args.resolution} ({args.aspect_ratio})...")
    if input_image:
        print("Mode: Image-to-video")
    else:
        print("Mode: Text-to-video")

    try:
        # Generate video using Veo 3.1
        if input_image:
            # Image-to-video mode
            operation = client.models.generate_videos(
                model="veo-3.1-generate-preview",
                prompt=args.prompt,
                image=input_image,
                config=types.GenerateVideosConfig(**generation_config)
            )
        else:
            # Text-to-video mode
            operation = client.models.generate_videos(
                model="veo-3.1-generate-preview",
                prompt=args.prompt,
                config=types.GenerateVideosConfig(**generation_config)
            )

        # Poll for completion
        print("Video generation in progress...")
        max_wait = 600  # 10 minutes max
        wait_time = 0
        poll_interval = 10

        while not operation.done:
            if wait_time >= max_wait:
                print("Error: Video generation timed out after 10 minutes.", file=sys.stderr)
                sys.exit(1)

            time.sleep(poll_interval)
            wait_time += poll_interval
            operation = client.operations.get(operation)
            print(f"  Still generating... ({wait_time}s elapsed)")

        # Check for errors
        if operation.error:
            print(f"Error: Video generation failed: {operation.error}", file=sys.stderr)
            sys.exit(1)

        # Get the result
        result = operation.result
        if not result or not result.generated_videos:
            print("Error: No video was generated.", file=sys.stderr)
            sys.exit(1)

        # Download and save the video
        video = result.generated_videos[0]
        video_data = video.video.video_bytes

        if not video_data:
            # If video_bytes not available, try downloading from URI
            if hasattr(video.video, 'uri') and video.video.uri:
                import urllib.request
                print(f"Downloading video from URI...")
                urllib.request.urlretrieve(video.video.uri, str(output_path))
            else:
                print("Error: Could not retrieve video data.", file=sys.stderr)
                sys.exit(1)
        else:
            output_path.write_bytes(video_data)

        full_path = output_path.resolve()
        print(f"\nVideo saved: {full_path}")
        # OpenClaw parses MEDIA: tokens and will attach the file on
        # supported chat providers.
        print(f"MEDIA:{full_path}")

    except Exception as e:
        print(f"Error generating video: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
