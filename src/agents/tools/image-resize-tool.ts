import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam, readNumberParam } from "./common.js";

/**
 * Image resize result
 */
export type ImageResizeResult = {
  id: string;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: string;
  sizeFormatted: string;
  publicUrl?: string;
};

/**
 * Handler interface that the platform provides
 */
export type ImageResizeHandler = {
  /** Resize an image to specified dimensions */
  resizeImage: (params: {
    imageSource: string; // file path, base64, or file ID
    sourceType: "path" | "base64" | "fileId";
    width?: number;
    height?: number;
    fit?: "cover" | "contain" | "fill" | "inside" | "outside";
    format?: "jpeg" | "png" | "webp" | "avif";
    quality?: number;
    filename?: string;
    isPublic?: boolean;
  }) => Promise<ImageResizeResult>;

  /** Crop an image to specified region */
  cropImage: (params: {
    imageSource: string;
    sourceType: "path" | "base64" | "fileId";
    left: number;
    top: number;
    width: number;
    height: number;
    format?: "jpeg" | "png" | "webp" | "avif";
    quality?: number;
    filename?: string;
    isPublic?: boolean;
  }) => Promise<ImageResizeResult>;

  /** Convert image format and/or compress */
  convertImage: (params: {
    imageSource: string;
    sourceType: "path" | "base64" | "fileId";
    format: "jpeg" | "png" | "webp" | "avif";
    quality?: number;
    filename?: string;
    isPublic?: boolean;
  }) => Promise<ImageResizeResult>;

  /** Create a thumbnail */
  createThumbnail: (params: {
    imageSource: string;
    sourceType: "path" | "base64" | "fileId";
    size?: number; // default 150
    format?: "jpeg" | "png" | "webp";
    filename?: string;
    isPublic?: boolean;
  }) => Promise<ImageResizeResult>;

  /** Send processed image to chat channel */
  sendImageToChannel?: (params: { fileId: string; caption?: string }) => Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;

  /** Remove background from an image (AI-powered) */
  removeBackground?: (params: {
    imageSource: string;
    sourceType: "path" | "base64" | "fileId";
    filename?: string;
    isPublic?: boolean;
  }) => Promise<ImageResizeResult>;
};

// Tool Schemas
const ImageResizeSchema = Type.Object({
  imagePath: Type.Optional(
    Type.String({ description: "Path to the image file (e.g., from a received attachment)" }),
  ),
  imageBase64: Type.Optional(Type.String({ description: "Base64-encoded image data" })),
  fileId: Type.Optional(Type.String({ description: "Cloud storage file ID" })),
  width: Type.Optional(Type.Number({ description: "Target width in pixels" })),
  height: Type.Optional(Type.Number({ description: "Target height in pixels" })),
  fit: Type.Optional(
    Type.String({
      description:
        "How to fit: cover (crop), contain (fit inside), fill (stretch), inside, outside",
    }),
  ),
  format: Type.Optional(Type.String({ description: "Output format: jpeg, png, webp, avif" })),
  quality: Type.Optional(Type.Number({ description: "Output quality 1-100 (default: 80)" })),
  filename: Type.Optional(
    Type.String({ description: "Output filename (auto-generated if not provided)" }),
  ),
  isPublic: Type.Optional(
    Type.Boolean({ description: "Make output publicly accessible (default: false)" }),
  ),
});

const ImageCropSchema = Type.Object({
  imagePath: Type.Optional(Type.String({ description: "Path to the image file" })),
  imageBase64: Type.Optional(Type.String({ description: "Base64-encoded image data" })),
  fileId: Type.Optional(Type.String({ description: "Cloud storage file ID" })),
  left: Type.Number({ description: "Left offset in pixels" }),
  top: Type.Number({ description: "Top offset in pixels" }),
  width: Type.Number({ description: "Crop width in pixels" }),
  height: Type.Number({ description: "Crop height in pixels" }),
  format: Type.Optional(Type.String({ description: "Output format: jpeg, png, webp, avif" })),
  quality: Type.Optional(Type.Number({ description: "Output quality 1-100 (default: 80)" })),
  filename: Type.Optional(Type.String({ description: "Output filename" })),
  isPublic: Type.Optional(Type.Boolean({ description: "Make output publicly accessible" })),
});

const ImageConvertSchema = Type.Object({
  imagePath: Type.Optional(Type.String({ description: "Path to the image file" })),
  imageBase64: Type.Optional(Type.String({ description: "Base64-encoded image data" })),
  fileId: Type.Optional(Type.String({ description: "Cloud storage file ID" })),
  format: Type.String({ description: "Target format: jpeg, png, webp, avif" }),
  quality: Type.Optional(Type.Number({ description: "Output quality 1-100 (default: 80)" })),
  filename: Type.Optional(Type.String({ description: "Output filename" })),
  isPublic: Type.Optional(Type.Boolean({ description: "Make output publicly accessible" })),
});

const ImageThumbnailSchema = Type.Object({
  imagePath: Type.Optional(Type.String({ description: "Path to the image file" })),
  imageBase64: Type.Optional(Type.String({ description: "Base64-encoded image data" })),
  fileId: Type.Optional(Type.String({ description: "Cloud storage file ID" })),
  size: Type.Optional(Type.Number({ description: "Thumbnail size in pixels (default: 150)" })),
  format: Type.Optional(Type.String({ description: "Output format: jpeg, png, webp" })),
  filename: Type.Optional(Type.String({ description: "Output filename" })),
  isPublic: Type.Optional(Type.Boolean({ description: "Make output publicly accessible" })),
});

const ImageSendSchema = Type.Object({
  fileId: Type.String({ description: "The ID of the processed image to send" }),
  caption: Type.Optional(Type.String({ description: "Message caption to send with the image" })),
});

const ImageBackgroundRemoveSchema = Type.Object({
  imagePath: Type.Optional(Type.String({ description: "Path to the image file" })),
  imageBase64: Type.Optional(Type.String({ description: "Base64-encoded image data" })),
  fileId: Type.Optional(Type.String({ description: "Cloud storage file ID" })),
  filename: Type.Optional(Type.String({ description: "Output filename" })),
  isPublic: Type.Optional(Type.Boolean({ description: "Make output publicly accessible" })),
});

function resolveSourceType(params: Record<string, unknown>): {
  source: string;
  type: "path" | "base64" | "fileId";
} | null {
  const imagePath = readStringParam(params, "imagePath");
  const imageBase64 = readStringParam(params, "imageBase64");
  const fileId = readStringParam(params, "fileId");

  if (imagePath) {
    return { source: imagePath, type: "path" };
  }
  if (imageBase64) {
    return { source: imageBase64, type: "base64" };
  }
  if (fileId) {
    return { source: fileId, type: "fileId" };
  }
  return null;
}

/**
 * Create the image_resize tool
 */
export function createImageResizeTool(handler: ImageResizeHandler): AnyAgentTool {
  return {
    label: "Resize Image",
    name: "image_resize",
    description: `Resize an image to specified dimensions.

Use this to:
- Resize images to specific width/height
- Scale down large images
- Create different size versions

Provide either imagePath (for received attachments), imageBase64, or fileId (for cloud storage files).
Specify width and/or height. If only one is provided, the other is calculated to maintain aspect ratio.`,
    parameters: ImageResizeSchema,
    execute: async (_toolCallId, params) => {
      try {
        const record =
          params && typeof params === "object" ? (params as Record<string, unknown>) : {};
        const sourceInfo = resolveSourceType(record);

        if (!sourceInfo) {
          return jsonResult({ error: "Provide imagePath, imageBase64, or fileId" });
        }

        const width = readNumberParam(record, "width", { integer: true });
        const height = readNumberParam(record, "height", { integer: true });

        if (!width && !height) {
          return jsonResult({ error: "Provide at least width or height" });
        }

        const fit = readStringParam(record, "fit") as
          | "cover"
          | "contain"
          | "fill"
          | "inside"
          | "outside"
          | undefined;
        const format = readStringParam(record, "format") as
          | "jpeg"
          | "png"
          | "webp"
          | "avif"
          | undefined;
        const quality = readNumberParam(record, "quality", { integer: true });
        const filename = readStringParam(record, "filename");
        const isPublic = record.isPublic === true;

        const result = await handler.resizeImage({
          imageSource: sourceInfo.source,
          sourceType: sourceInfo.type,
          width: width ?? undefined,
          height: height ?? undefined,
          fit,
          format,
          quality: quality ?? undefined,
          filename,
          isPublic,
        });

        return jsonResult({
          success: true,
          fileId: result.id,
          filename: result.filename,
          dimensions: `${result.width}x${result.height}`,
          size: result.sizeFormatted,
          mimeType: result.mimeType,
          publicUrl: result.publicUrl,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the image_crop tool
 */
export function createImageCropTool(handler: ImageResizeHandler): AnyAgentTool {
  return {
    label: "Crop Image",
    name: "image_crop",
    description: `Crop an image to a specific region.

Use this to:
- Extract a portion of an image
- Remove unwanted areas
- Focus on a specific part

Specify left, top, width, height in pixels.`,
    parameters: ImageCropSchema,
    execute: async (_toolCallId, params) => {
      try {
        const record =
          params && typeof params === "object" ? (params as Record<string, unknown>) : {};
        const sourceInfo = resolveSourceType(record);

        if (!sourceInfo) {
          return jsonResult({ error: "Provide imagePath, imageBase64, or fileId" });
        }

        const left = readNumberParam(record, "left", { integer: true, required: true });
        const top = readNumberParam(record, "top", { integer: true, required: true });
        const width = readNumberParam(record, "width", { integer: true, required: true });
        const height = readNumberParam(record, "height", { integer: true, required: true });

        if (
          left === undefined ||
          top === undefined ||
          width === undefined ||
          height === undefined
        ) {
          return jsonResult({ error: "Provide left, top, width, and height" });
        }

        const format = readStringParam(record, "format") as
          | "jpeg"
          | "png"
          | "webp"
          | "avif"
          | undefined;
        const quality = readNumberParam(record, "quality", { integer: true });
        const filename = readStringParam(record, "filename");
        const isPublic = record.isPublic === true;

        const result = await handler.cropImage({
          imageSource: sourceInfo.source,
          sourceType: sourceInfo.type,
          left: left,
          top: top,
          width: width,
          height: height,
          format,
          quality: quality ?? undefined,
          filename,
          isPublic,
        });

        return jsonResult({
          success: true,
          fileId: result.id,
          filename: result.filename,
          dimensions: `${result.width}x${result.height}`,
          size: result.sizeFormatted,
          mimeType: result.mimeType,
          publicUrl: result.publicUrl,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the image_convert tool
 */
export function createImageConvertTool(handler: ImageResizeHandler): AnyAgentTool {
  return {
    label: "Convert Image",
    name: "image_convert",
    description: `Convert an image to a different format and/or compress it.

Supported formats:
- jpeg - Best for photos, smaller file size
- png - Best for graphics, supports transparency
- webp - Modern format, excellent compression
- avif - Next-gen format, best compression

Use quality (1-100) to control compression. Lower = smaller file.`,
    parameters: ImageConvertSchema,
    execute: async (_toolCallId, params) => {
      try {
        const record =
          params && typeof params === "object" ? (params as Record<string, unknown>) : {};
        const sourceInfo = resolveSourceType(record);

        if (!sourceInfo) {
          return jsonResult({ error: "Provide imagePath, imageBase64, or fileId" });
        }

        const format = readStringParam(record, "format", { required: true }) as
          | "jpeg"
          | "png"
          | "webp"
          | "avif";
        if (!format) {
          return jsonResult({ error: "Provide target format" });
        }

        const quality = readNumberParam(record, "quality", { integer: true });
        const filename = readStringParam(record, "filename");
        const isPublic = record.isPublic === true;

        const result = await handler.convertImage({
          imageSource: sourceInfo.source,
          sourceType: sourceInfo.type,
          format,
          quality: quality ?? undefined,
          filename,
          isPublic,
        });

        return jsonResult({
          success: true,
          fileId: result.id,
          filename: result.filename,
          dimensions: `${result.width}x${result.height}`,
          size: result.sizeFormatted,
          mimeType: result.mimeType,
          publicUrl: result.publicUrl,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the image_thumbnail tool
 */
export function createImageThumbnailTool(handler: ImageResizeHandler): AnyAgentTool {
  return {
    label: "Create Thumbnail",
    name: "image_thumbnail",
    description: `Create a square thumbnail from an image.

The image is center-cropped to a square and resized to the specified size (default: 150px).
Use this for creating profile pictures, preview images, or gallery thumbnails.`,
    parameters: ImageThumbnailSchema,
    execute: async (_toolCallId, params) => {
      try {
        const record =
          params && typeof params === "object" ? (params as Record<string, unknown>) : {};
        const sourceInfo = resolveSourceType(record);

        if (!sourceInfo) {
          return jsonResult({ error: "Provide imagePath, imageBase64, or fileId" });
        }

        const size = readNumberParam(record, "size", { integer: true }) ?? 150;
        const format = readStringParam(record, "format") as "jpeg" | "png" | "webp" | undefined;
        const filename = readStringParam(record, "filename");
        const isPublic = record.isPublic === true;

        const result = await handler.createThumbnail({
          imageSource: sourceInfo.source,
          sourceType: sourceInfo.type,
          size,
          format,
          filename,
          isPublic,
        });

        return jsonResult({
          success: true,
          fileId: result.id,
          filename: result.filename,
          dimensions: `${result.width}x${result.height}`,
          size: result.sizeFormatted,
          mimeType: result.mimeType,
          publicUrl: result.publicUrl,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the image_send tool
 */
export function createImageSendTool(handler: ImageResizeHandler): AnyAgentTool | null {
  if (!handler.sendImageToChannel) {
    return null;
  }

  return {
    label: "Send Processed Image",
    name: "image_send",
    description: `Send a processed image directly to the user as a message attachment.

Use this IMMEDIATELY after resizing, cropping, or converting an image to deliver it to the user.
This sends the actual image as an attachment in the chat.

Example workflow:
1. image_resize imagePath="/tmp/photo.jpg" width=800
2. image_send fileId="<fileId>" caption="Here's your resized image"`,
    parameters: ImageSendSchema,
    execute: async (_toolCallId, params) => {
      try {
        const record =
          params && typeof params === "object" ? (params as Record<string, unknown>) : {};
        const fileId = readStringParam(record, "fileId", { required: true });
        const caption = readStringParam(record, "caption");

        if (!fileId) {
          return jsonResult({ error: "Provide fileId" });
        }

        const result = await handler.sendImageToChannel!({ fileId, caption });

        if (!result.success) {
          return jsonResult({ error: result.error ?? "Failed to send image" });
        }

        return jsonResult({
          success: true,
          messageId: result.messageId,
          message: "Image sent to chat successfully.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the background_remove tool
 */
export function createBackgroundRemoveTool(handler: ImageResizeHandler): AnyAgentTool | null {
  if (!handler.removeBackground) {
    return null;
  }

  return {
    label: "Remove Background",
    name: "background_remove",
    description: `Remove the background from an image using AI.

Use this to:
- Create transparent PNGs from photos
- Remove backgrounds for product images
- Isolate subjects from their backgrounds

The output is always a PNG with transparency.`,
    parameters: ImageBackgroundRemoveSchema,
    execute: async (_toolCallId, params) => {
      try {
        const record =
          params && typeof params === "object" ? (params as Record<string, unknown>) : {};
        const sourceInfo = resolveSourceType(record);

        if (!sourceInfo) {
          return jsonResult({ error: "Provide imagePath, imageBase64, or fileId" });
        }

        const filename = readStringParam(record, "filename");
        const isPublic = record.isPublic === true;

        const result = await handler.removeBackground!({
          imageSource: sourceInfo.source,
          sourceType: sourceInfo.type,
          filename,
          isPublic,
        });

        return jsonResult({
          success: true,
          fileId: result.id,
          filename: result.filename,
          dimensions: `${result.width}x${result.height}`,
          size: result.sizeFormatted,
          mimeType: result.mimeType,
          publicUrl: result.publicUrl,
          message: "Background removed successfully. Use image_send to deliver the image.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create all image resize tools
 */
export function createImageResizeTools(handler: ImageResizeHandler): AnyAgentTool[] {
  const tools: AnyAgentTool[] = [
    createImageResizeTool(handler),
    createImageCropTool(handler),
    createImageConvertTool(handler),
    createImageThumbnailTool(handler),
  ];

  const sendTool = createImageSendTool(handler);
  if (sendTool) {
    tools.push(sendTool);
  }

  const bgRemoveTool = createBackgroundRemoveTool(handler);
  if (bgRemoveTool) {
    tools.push(bgRemoveTool);
  }

  return tools;
}
