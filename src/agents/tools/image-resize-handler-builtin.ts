import crypto from "node:crypto";
/**
 * Built-in Sharp-based image resize handler for OpenClaw.
 * This provides image processing capabilities without requiring platform-api injection.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ImageResizeHandler, ImageResizeResult } from "./image-resize-tool.js";

// Dynamic import of sharp to handle cases where it's not installed
let sharpModule: typeof import("sharp") | null = null;

async function getSharp() {
  if (sharpModule) {
    return sharpModule;
  }
  try {
    sharpModule = (await import("sharp")).default as unknown as typeof import("sharp");
    return sharpModule;
  } catch {
    throw new Error("Sharp is not installed. Run: pnpm add sharp");
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function generateId(): string {
  return crypto.randomUUID();
}

function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
  };
  return mimeTypes[format] || "application/octet-stream";
}

async function loadImageBuffer(
  imageSource: string,
  sourceType: "path" | "base64" | "fileId",
): Promise<Buffer> {
  if (sourceType === "path") {
    return fs.promises.readFile(imageSource);
  }
  if (sourceType === "base64") {
    // Handle data URI format
    const base64Data = imageSource.includes(",") ? imageSource.split(",")[1] : imageSource;
    return Buffer.from(base64Data, "base64");
  }
  // fileId - treat as path for now (could be extended for cloud storage)
  return fs.promises.readFile(imageSource);
}

function getOutputDir(): string {
  const outputDir = path.join(os.tmpdir(), "openclaw-images");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  return outputDir;
}

/**
 * Create a built-in image resize handler using Sharp
 */
export function createBuiltinImageResizeHandler(): ImageResizeHandler {
  return {
    async resizeImage(params): Promise<ImageResizeResult> {
      const sharp = await getSharp();
      const buffer = await loadImageBuffer(params.imageSource, params.sourceType);

      let pipeline = sharp(buffer);

      if (params.width || params.height) {
        pipeline = pipeline.resize(params.width, params.height, {
          fit: params.fit || "inside",
          withoutEnlargement: true,
        });
      }

      const format = params.format || "jpeg";
      const quality = params.quality || 80;

      if (format === "jpeg") {
        pipeline = pipeline.jpeg({ quality });
      } else if (format === "png") {
        pipeline = pipeline.png({ quality });
      } else if (format === "webp") {
        pipeline = pipeline.webp({ quality });
      } else if (format === "avif") {
        pipeline = pipeline.avif({ quality });
      }

      const outputBuffer = await pipeline.toBuffer();
      const metadata = await sharp(outputBuffer).metadata();

      const id = generateId();
      const filename = params.filename || `resized-${id}.${format}`;
      const outputPath = path.join(getOutputDir(), filename);
      await fs.promises.writeFile(outputPath, outputBuffer);

      return {
        id,
        filename,
        mimeType: getMimeType(format),
        width: metadata.width || 0,
        height: metadata.height || 0,
        sizeBytes: String(outputBuffer.length),
        sizeFormatted: formatBytes(outputBuffer.length),
        publicUrl: outputPath,
      };
    },

    async cropImage(params): Promise<ImageResizeResult> {
      const sharp = await getSharp();
      const buffer = await loadImageBuffer(params.imageSource, params.sourceType);

      let pipeline = sharp(buffer).extract({
        left: params.left,
        top: params.top,
        width: params.width,
        height: params.height,
      });

      const format = params.format || "jpeg";
      const quality = params.quality || 80;

      if (format === "jpeg") {
        pipeline = pipeline.jpeg({ quality });
      } else if (format === "png") {
        pipeline = pipeline.png({ quality });
      } else if (format === "webp") {
        pipeline = pipeline.webp({ quality });
      } else if (format === "avif") {
        pipeline = pipeline.avif({ quality });
      }

      const outputBuffer = await pipeline.toBuffer();
      const metadata = await sharp(outputBuffer).metadata();

      const id = generateId();
      const filename = params.filename || `cropped-${id}.${format}`;
      const outputPath = path.join(getOutputDir(), filename);
      await fs.promises.writeFile(outputPath, outputBuffer);

      return {
        id,
        filename,
        mimeType: getMimeType(format),
        width: metadata.width || 0,
        height: metadata.height || 0,
        sizeBytes: String(outputBuffer.length),
        sizeFormatted: formatBytes(outputBuffer.length),
        publicUrl: outputPath,
      };
    },

    async convertImage(params): Promise<ImageResizeResult> {
      const sharp = await getSharp();
      const buffer = await loadImageBuffer(params.imageSource, params.sourceType);

      let pipeline = sharp(buffer);
      const format = params.format;
      const quality = params.quality || 80;

      if (format === "jpeg") {
        pipeline = pipeline.jpeg({ quality });
      } else if (format === "png") {
        pipeline = pipeline.png({ quality });
      } else if (format === "webp") {
        pipeline = pipeline.webp({ quality });
      } else if (format === "avif") {
        pipeline = pipeline.avif({ quality });
      }

      const outputBuffer = await pipeline.toBuffer();
      const metadata = await sharp(outputBuffer).metadata();

      const id = generateId();
      const filename = params.filename || `converted-${id}.${format}`;
      const outputPath = path.join(getOutputDir(), filename);
      await fs.promises.writeFile(outputPath, outputBuffer);

      return {
        id,
        filename,
        mimeType: getMimeType(format),
        width: metadata.width || 0,
        height: metadata.height || 0,
        sizeBytes: String(outputBuffer.length),
        sizeFormatted: formatBytes(outputBuffer.length),
        publicUrl: outputPath,
      };
    },

    async createThumbnail(params): Promise<ImageResizeResult> {
      const sharp = await getSharp();
      const buffer = await loadImageBuffer(params.imageSource, params.sourceType);

      const size = params.size || 150;
      const format = params.format || "jpeg";

      let pipeline = sharp(buffer).resize(size, size, {
        fit: "cover",
        position: "center",
      });

      if (format === "jpeg") {
        pipeline = pipeline.jpeg({ quality: 80 });
      } else if (format === "png") {
        pipeline = pipeline.png();
      } else if (format === "webp") {
        pipeline = pipeline.webp({ quality: 80 });
      }

      const outputBuffer = await pipeline.toBuffer();
      const metadata = await sharp(outputBuffer).metadata();

      const id = generateId();
      const filename = params.filename || `thumb-${id}.${format}`;
      const outputPath = path.join(getOutputDir(), filename);
      await fs.promises.writeFile(outputPath, outputBuffer);

      return {
        id,
        filename,
        mimeType: getMimeType(format),
        width: metadata.width || 0,
        height: metadata.height || 0,
        sizeBytes: String(outputBuffer.length),
        sizeFormatted: formatBytes(outputBuffer.length),
        publicUrl: outputPath,
      };
    },
  };
}

// Singleton instance
let builtinHandler: ImageResizeHandler | null = null;

/**
 * Get the built-in image resize handler (singleton)
 */
export function getBuiltinImageResizeHandler(): ImageResizeHandler {
  if (!builtinHandler) {
    builtinHandler = createBuiltinImageResizeHandler();
  }
  return builtinHandler;
}
