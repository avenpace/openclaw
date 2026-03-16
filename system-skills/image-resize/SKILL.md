---
name: image-resize
description: Resize, crop, transform, filter, and edit images on the server.
metadata: { "clawdbot": { "emoji": "🖼️" } }
---

# Image Processing

You have access to comprehensive image processing tools. These run on the server (no device required).

## Available Tools

### Basic Operations

- **image_resize** - Resize an image to specified dimensions
- **image_crop** - Crop an image to a specific region
- **image_convert** - Convert image format and/or compress
- **image_thumbnail** - Create a square thumbnail
- **image_rotate** - Rotate an image by degrees
- **image_flip** - Flip an image horizontally or vertically

### Filters & Adjustments

- **image_filter** - Apply filters (blur, sharpen, grayscale, sepia, negate)
- **image_adjust** - Adjust brightness, contrast, saturation, hue

### Overlays & Drawing

- **image_text_overlay** - Add text overlay to an image
- **image_draw** - Create images by drawing shapes (rectangles, circles, lines, text)

### Advanced

- **background_remove** - Remove background from image (AI-powered, outputs transparent PNG)
- **image_send** - Send processed image to the user

## Common Workflows

### Resize an image from user attachment

```
1. image_resize imagePath="/tmp/media/photo.jpg" width=800
2. image_send fileId="<result.fileId>" caption="Here's your resized image!"
```

### Rotate an image

```
1. image_rotate imagePath="/tmp/media/photo.jpg" angle=90
2. image_send fileId="<result.fileId>" caption="Rotated 90 degrees!"
```

Angle: positive = clockwise, negative = counter-clockwise. Examples: 90, -90, 180, 45.

### Flip an image

```
1. image_flip imagePath="/tmp/media/photo.jpg" direction="horizontal"
2. image_send fileId="<result.fileId>" caption="Flipped horizontally!"
```

Direction options: `horizontal`, `vertical`, or `both`.

### Apply filters

```
1. image_filter imagePath="/tmp/media/photo.jpg" filter="grayscale"
2. image_send fileId="<result.fileId>" caption="Converted to grayscale!"
```

Available filters:

- **blur** - Gaussian blur (use `intensity` for sigma, default 3)
- **sharpen** - Sharpen image (use `intensity` for sigma, default 1)
- **grayscale** - Convert to grayscale
- **sepia** - Apply sepia/vintage tone
- **negate** - Invert colors

### Adjust brightness and contrast

```
1. image_adjust imagePath="/tmp/media/photo.jpg" brightness=1.3 contrast=1.2
2. image_send fileId="<result.fileId>" caption="Enhanced image!"
```

Parameters (1.0 = no change):

- **brightness** - >1 brighter, <1 darker
- **contrast** - >1 more contrast, <1 less contrast
- **saturation** - >1 more saturated, 0 = grayscale
- **hue** - Rotate hue by degrees (0-360)

### Add text overlay

```
1. image_text_overlay imagePath="/tmp/media/photo.jpg" text="Hello World" x=50 y=100 fontSize=36 fontColor="white"
2. image_send fileId="<result.fileId>" caption="Added text!"
```

Parameters:

- **text** - The text to add
- **x, y** - Position from top-left corner
- **fontSize** - Size in pixels (default: 24)
- **fontColor** - Color name or hex (default: white)
- **backgroundColor** - Optional background behind text

### Draw simple images

Create a new image with shapes:

```
1. image_draw width=400 height=300 background="white" shapes=[{"type":"rectangle","x":50,"y":50,"width":100,"height":80,"fill":"blue"},{"type":"circle","x":250,"y":150,"radius":50,"fill":"red"},{"type":"text","x":150,"y":280,"text":"Hello!","fontSize":24,"fill":"black"}]
2. image_send fileId="<result.fileId>" caption="Here's your drawing!"
```

Shape types:

- **rectangle** - x, y, width, height, fill, stroke
- **circle** - x, y (center), radius, fill, stroke
- **line** - x, y (start), x2, y2 (end), stroke, strokeWidth
- **text** - x, y, text, fontSize, fill

### Convert image format

```
1. image_convert imagePath="/tmp/media/photo.png" format="webp" quality=85
2. image_send fileId="<result.fileId>" caption="Converted to WebP format"
```

### Create a thumbnail

```
1. image_thumbnail imagePath="/tmp/media/photo.jpg" size=200
2. image_send fileId="<result.fileId>" caption="Here's your thumbnail"
```

### Crop an image

```
1. image_crop imagePath="/tmp/media/photo.jpg" left=100 top=50 width=400 height=300
2. image_send fileId="<result.fileId>" caption="Cropped image"
```

### Remove background

```
1. background_remove imagePath="/tmp/media/photo.jpg"
2. image_send fileId="<result.fileId>" caption="Background removed!"
```

## Image Sources

You can process images from three sources:

1. **imagePath** - File path (from received attachments, e.g., `/tmp/media/xxx.jpg`)
2. **imageBase64** - Base64-encoded image data
3. **fileId** - Cloud storage file ID (if image is already in cloud storage)

## Output Formats

Supported output formats:

- **jpeg** - Best for photos, smaller file size, no transparency
- **png** - Best for graphics, supports transparency
- **webp** - Modern format, excellent compression, supports transparency
- **avif** - Next-gen format, best compression (may not be supported everywhere)

## Quality

Use the `quality` parameter (1-100) to control compression:

- **100** - Maximum quality, larger file
- **80** - Good quality (default)
- **60** - Acceptable quality, smaller file
- **40** - Noticeable quality loss, much smaller file

## Tips

- **Always use `image_send`** to deliver processed images to users
- Chain operations: resize first, then apply filters
- For photos, use JPEG or WebP format
- For images with transparency, use PNG or WebP
- Use `image_thumbnail` for profile pictures or previews
- Specify only width OR height to maintain aspect ratio automatically
