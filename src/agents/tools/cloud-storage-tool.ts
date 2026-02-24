import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam, readNumberParam } from "./common.js";

/**
 * Cloud file information
 */
export type CloudFileInfo = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: string;
  sizeFormatted: string;
  isPublic: boolean;
  folderId: string | null;
  createdAt: string;
  publicUrl?: string;
};

/**
 * Cloud folder information
 */
export type CloudFolderInfo = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
};

/**
 * Storage info
 */
export type CloudStorageInfo = {
  tier: string;
  used: { bytes: string; formatted: string };
  quota: { bytes: string; formatted: string };
  remaining: { bytes: string; formatted: string };
  usedPercent: number;
  maxFileSize: { bytes: string; formatted: string };
  fileCount: number;
};

/**
 * Handler interface that the platform provides
 */
export type CloudStorageHandler = {
  /** Get storage quota and usage info */
  getStorageInfo: () => Promise<CloudStorageInfo>;

  /** List files in a folder */
  listFiles: (params: {
    folderId?: string | null;
    limit?: number;
    offset?: number;
  }) => Promise<{ files: CloudFileInfo[]; total: number }>;

  /** List folders */
  listFolders: (parentId?: string | null) => Promise<{ folders: CloudFolderInfo[] }>;

  /** Get file info and download URL */
  getFile: (fileId: string) => Promise<{
    file: CloudFileInfo;
    downloadUrl: string;
  } | null>;

  /** Read file content as text (for text files) */
  readFileContent: (fileId: string) => Promise<{
    content: string;
    mimeType: string;
    truncated: boolean;
  } | null>;

  /** Upload content to cloud storage */
  uploadContent: (params: {
    filename: string;
    content: string;
    mimeType?: string;
    folderId?: string;
    isPublic?: boolean;
  }) => Promise<{
    id: string;
    publicUrl?: string;
    sizeBytes: string;
  }>;

  /** Upload base64 content to cloud storage (binary-safe) */
  uploadBase64: (params: {
    filename: string;
    contentBase64: string;
    mimeType?: string;
    folderId?: string;
    isPublic?: boolean;
  }) => Promise<{
    id: string;
    publicUrl?: string;
    sizeBytes: string;
  }>;

  /** Extract text from a document stored in cloud storage */
  extractText: (params: {
    fileId: string;
    maxChars?: number;
  }) => Promise<{
    content: string;
    mimeType: string;
    truncated: boolean;
  } | null>;

  /** Delete a file */
  deleteFile: (fileId: string) => Promise<void>;

  /** Update file (rename, toggle public, move) */
  updateFile: (
    fileId: string,
    updates: {
      filename?: string;
      isPublic?: boolean;
      folderId?: string | null;
    }
  ) => Promise<void>;

  /** Create a folder */
  createFolder: (name: string, parentId?: string) => Promise<{ id: string; name: string }>;

  /** Delete a folder */
  deleteFolder: (folderId: string) => Promise<void>;

  /** Create a document (docx/xlsx/pptx/pdf) and save to cloud */
  createDocument: (params: {
    type: "docx" | "xlsx" | "pptx" | "pdf";
    filename?: string;
    title?: string;
    content?: string;
    csv?: string;
    sheets?: Array<{ name?: string; rows: string[][] }>;
    slides?: Array<{ title?: string; bullets?: string[] }>;
    folderId?: string;
    isPublic?: boolean;
  }) => Promise<{
    id: string;
    publicUrl?: string;
    sizeBytes: string;
    filename: string;
    mimeType: string;
  }>;
};

// Tool Schemas
const CloudStorageInfoSchema = Type.Object({});

const CloudListFilesSchema = Type.Object({
  folderId: Type.Optional(Type.String({ description: "Folder ID to list files from (omit for root)" })),
  limit: Type.Optional(Type.Number({ description: "Max number of files to return (default: 20)" })),
});

const CloudListFoldersSchema = Type.Object({
  parentId: Type.Optional(Type.String({ description: "Parent folder ID (omit for root folders)" })),
});

const CloudGetFileSchema = Type.Object({
  fileId: Type.String({ description: "The file ID to get info for" }),
});

const CloudReadFileSchema = Type.Object({
  fileId: Type.String({ description: "The file ID to read content from" }),
});

const CloudUploadSchema = Type.Object({
  filename: Type.String({ description: "Name for the file (e.g., 'notes.txt', 'data.json')" }),
  content: Type.String({ description: "The text content to upload" }),
  mimeType: Type.Optional(Type.String({ description: "MIME type (default: auto-detect from filename)" })),
  folderId: Type.Optional(Type.String({ description: "Folder ID to upload to (omit for root)" })),
  isPublic: Type.Optional(Type.Boolean({ description: "Make file publicly accessible (default: false)" })),
});

const CloudUploadBase64Schema = Type.Object({
  filename: Type.String({ description: "Name for the file (e.g., 'report.pdf', 'slides.pptx')" }),
  contentBase64: Type.String({ description: "Base64-encoded file content" }),
  mimeType: Type.Optional(Type.String({ description: "MIME type (default: auto-detect from filename)" })),
  folderId: Type.Optional(Type.String({ description: "Folder ID to upload to (omit for root)" })),
  isPublic: Type.Optional(Type.Boolean({ description: "Make file publicly accessible (default: false)" })),
});

const CloudExtractTextSchema = Type.Object({
  fileId: Type.String({ description: "The file ID to extract text from" }),
  maxChars: Type.Optional(Type.Number({ description: "Max characters to return (default: 50000)" })),
});

const CloudCreateDocumentSchema = Type.Object({
  type: Type.Union([
    Type.Literal("docx"),
    Type.Literal("xlsx"),
    Type.Literal("pptx"),
    Type.Literal("pdf"),
  ]),
  filename: Type.Optional(Type.String({ description: "Filename to save (extension optional)" })),
  title: Type.Optional(Type.String({ description: "Document title" })),
  content: Type.Optional(Type.String({ description: "Main document content (docx/pdf)" })),
  csv: Type.Optional(Type.String({ description: "CSV content (xlsx)" })),
  sheets: Type.Optional(Type.Array(
    Type.Object({
      name: Type.Optional(Type.String({ description: "Sheet name" })),
      rows: Type.Array(Type.Array(Type.String())),
    })
  )),
  slides: Type.Optional(Type.Array(
    Type.Object({
      title: Type.Optional(Type.String({ description: "Slide title" })),
      bullets: Type.Optional(Type.Array(Type.String())),
    })
  )),
  folderId: Type.Optional(Type.String({ description: "Folder ID to upload to (omit for root)" })),
  isPublic: Type.Optional(Type.Boolean({ description: "Make file publicly accessible (default: false)" })),
});

const CloudDeleteFileSchema = Type.Object({
  fileId: Type.String({ description: "The file ID to delete" }),
});

const CloudUpdateFileSchema = Type.Object({
  fileId: Type.String({ description: "The file ID to update" }),
  filename: Type.Optional(Type.String({ description: "New filename" })),
  isPublic: Type.Optional(Type.Boolean({ description: "Set public/private" })),
  folderId: Type.Optional(Type.String({ description: "Move to folder (use 'root' for root folder)" })),
});

const CloudCreateFolderSchema = Type.Object({
  name: Type.String({ description: "Folder name" }),
  parentId: Type.Optional(Type.String({ description: "Parent folder ID (omit for root)" })),
});

const CloudDeleteFolderSchema = Type.Object({
  folderId: Type.String({ description: "The folder ID to delete" }),
});

const CloudShareFileSchema = Type.Object({
  fileId: Type.String({ description: "The file ID to share" }),
});

/**
 * Create the cloud_storage_info tool
 */
export function createCloudStorageInfoTool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "Cloud Storage Info",
    name: "cloud_storage_info",
    description: "Get the user's cloud storage quota, usage, and limits. Shows how much space is used and available.",
    parameters: CloudStorageInfoSchema,
    execute: async () => {
      try {
        const info = await handler.getStorageInfo();
        return jsonResult({
          tier: info.tier,
          used: info.used.formatted,
          quota: info.quota.formatted,
          remaining: info.remaining.formatted,
          usedPercent: info.usedPercent,
          maxFileSize: info.maxFileSize.formatted,
          fileCount: info.fileCount,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the cloud_list_files tool
 */
export function createCloudListFilesTool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "List Cloud Files",
    name: "cloud_list_files",
    description: `List files stored in the user's cloud storage. Returns file names, sizes, and whether they are public.

Use this to:
- See what files the user has stored in cloud
- Find a file by browsing folders
- Check file details before reading or sharing`,
    parameters: CloudListFilesSchema,
    execute: async (_toolCallId, params) => {
      try {
        const folderId = readStringParam(params, "folderId");
        const limit = readNumberParam(params, "limit", { integer: true }) ?? 20;

        const result = await handler.listFiles({
          folderId: folderId === "root" ? null : folderId,
          limit,
        });

        if (result.files.length === 0) {
          return jsonResult({
            files: [],
            total: 0,
            message: folderId ? "No files in this folder." : "No files in cloud storage yet.",
          });
        }

        return jsonResult({
          files: result.files.map((f) => ({
            id: f.id,
            name: f.filename,
            size: f.sizeFormatted,
            type: f.mimeType,
            isPublic: f.isPublic,
            publicUrl: f.publicUrl,
            created: f.createdAt,
          })),
          total: result.total,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the cloud_list_folders tool
 */
export function createCloudListFoldersTool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "List Cloud Folders",
    name: "cloud_list_folders",
    description: "List folders in the user's cloud storage. Use to navigate the folder structure.",
    parameters: CloudListFoldersSchema,
    execute: async (_toolCallId, params) => {
      try {
        const parentId = readStringParam(params, "parentId");
        const result = await handler.listFolders(parentId === "root" ? null : parentId);

        if (result.folders.length === 0) {
          return jsonResult({
            folders: [],
            message: "No folders found.",
          });
        }

        return jsonResult({
          folders: result.folders.map((f) => ({
            id: f.id,
            name: f.name,
            parentId: f.parentId,
          })),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the cloud_get_file tool
 */
export function createCloudGetFileTool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "Get Cloud File Info",
    name: "cloud_get_file",
    description: "Get detailed information about a specific file in cloud storage, including download URL.",
    parameters: CloudGetFileSchema,
    execute: async (_toolCallId, params) => {
      try {
        const fileId = readStringParam(params, "fileId", { required: true });
        const result = await handler.getFile(fileId);

        if (!result) {
          return jsonResult({ error: "File not found" });
        }

        return jsonResult({
          id: result.file.id,
          name: result.file.filename,
          size: result.file.sizeFormatted,
          type: result.file.mimeType,
          isPublic: result.file.isPublic,
          publicUrl: result.file.publicUrl,
          downloadUrl: result.downloadUrl,
          created: result.file.createdAt,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the cloud_read_file tool
 */
export function createCloudReadFileTool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "Read Cloud File",
    name: "cloud_read_file",
    description: `Read the content of a text file from cloud storage.

Works with: .txt, .md, .json, .csv, .xml, .html, .css, .js, .ts, .py, and other text formats.
Does NOT work with: binary files like images, PDFs, videos, archives.

Use cloud_get_file first to check the file type if unsure.`,
    parameters: CloudReadFileSchema,
    execute: async (_toolCallId, params) => {
      try {
        const fileId = readStringParam(params, "fileId", { required: true });
        const result = await handler.readFileContent(fileId);

        if (!result) {
          return jsonResult({ error: "File not found or cannot be read as text" });
        }

        return jsonResult({
          content: result.content,
          mimeType: result.mimeType,
          truncated: result.truncated,
          message: result.truncated ? "Content was truncated due to size limits." : undefined,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the cloud_upload tool
 */
export function createCloudUploadTool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "Upload to Cloud",
    name: "cloud_upload",
    description: `Upload text content to the user's cloud storage.

Use this to:
- Save notes, documents, or data to cloud
- Create files that can be accessed later
- Store generated content for the user

The content is uploaded as a text file. Set isPublic=true to get a shareable URL.`,
    parameters: CloudUploadSchema,
    execute: async (_toolCallId, params) => {
      try {
        const filename = readStringParam(params, "filename", { required: true });
        const content = readStringParam(params, "content", { required: true, allowEmpty: true });
        const mimeType = readStringParam(params, "mimeType");
        const folderId = readStringParam(params, "folderId");
        const isPublic = params.isPublic === true;

        const result = await handler.uploadContent({
          filename,
          content,
          mimeType,
          folderId,
          isPublic,
        });

        return jsonResult({
          success: true,
          fileId: result.id,
          size: result.sizeBytes,
          publicUrl: result.publicUrl,
          message: isPublic
            ? `File uploaded and available at: ${result.publicUrl}`
            : "File uploaded to cloud storage.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the cloud_upload_base64 tool
 */
export function createCloudUploadBase64Tool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "Upload Base64 to Cloud",
    name: "cloud_upload_base64",
    description: `Upload base64-encoded content to the user's cloud storage.

Use this to:
- Save binary files (PDFs, DOCX, XLSX, PPTX, images)
- Upload files generated by other tools

The content must be base64-encoded. Set isPublic=true to get a shareable URL.`,
    parameters: CloudUploadBase64Schema,
    execute: async (_toolCallId, params) => {
      try {
        const filename = readStringParam(params, "filename", { required: true });
        const contentBase64 = readStringParam(params, "contentBase64", { required: true });
        const mimeType = readStringParam(params, "mimeType");
        const folderId = readStringParam(params, "folderId");
        const isPublic = params.isPublic === true;

        const result = await handler.uploadBase64({
          filename,
          contentBase64,
          mimeType,
          folderId,
          isPublic,
        });

        return jsonResult({
          success: true,
          fileId: result.id,
          size: result.sizeBytes,
          publicUrl: result.publicUrl,
          message: isPublic
            ? `File uploaded and available at: ${result.publicUrl}`
            : "File uploaded to cloud storage.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the cloud_extract_text tool
 */
export function createCloudExtractTextTool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "Extract Text from Cloud File",
    name: "cloud_extract_text",
    description: `Extract text from a document stored in cloud storage.

Works with: PDF, DOCX, XLSX, PPTX, TXT, MD, CSV, JSON.
Use cloud_get_file first if unsure about file type.`,
    parameters: CloudExtractTextSchema,
    execute: async (_toolCallId, params) => {
      try {
        const fileId = readStringParam(params, "fileId", { required: true });
        const maxChars = readNumberParam(params, "maxChars", { integer: true }) ?? 50000;

        const result = await handler.extractText({ fileId, maxChars });
        if (!result) {
          return jsonResult({ error: "File not found or unsupported type" });
        }

        return jsonResult({
          content: result.content,
          mimeType: result.mimeType,
          truncated: result.truncated,
          message: result.truncated ? "Content was truncated due to size limits." : undefined,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the cloud_create_document tool
 */
export function createCloudCreateDocumentTool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "Create Document in Cloud",
    name: "cloud_create_document",
    description: `Create a document (DOCX, XLSX, PPTX, PDF) and save it to cloud storage.

Use this to:
- Generate reports and documents
- Create spreadsheets from data
- Build slide decks
- Export PDFs from text

Provide content based on the document type.`,
    parameters: CloudCreateDocumentSchema,
    execute: async (_toolCallId, params) => {
      try {
        const type = readStringParam(params, "type", { required: true }) as "docx" | "xlsx" | "pptx" | "pdf";
        const filename = readStringParam(params, "filename");
        const title = readStringParam(params, "title");
        const content = readStringParam(params, "content", { allowEmpty: true });
        const csv = readStringParam(params, "csv", { allowEmpty: true });
        const folderId = readStringParam(params, "folderId");
        const isPublic = params.isPublic === true;

        const result = await handler.createDocument({
          type,
          filename,
          title,
          content: content ?? undefined,
          csv: csv ?? undefined,
          sheets: Array.isArray(params.sheets) ? params.sheets : undefined,
          slides: Array.isArray(params.slides) ? params.slides : undefined,
          folderId,
          isPublic,
        });

        return jsonResult({
          success: true,
          fileId: result.id,
          filename: result.filename,
          mimeType: result.mimeType,
          size: result.sizeBytes,
          publicUrl: result.publicUrl,
          message: isPublic
            ? `Document created and available at: ${result.publicUrl}`
            : "Document created in cloud storage.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the cloud_delete_file tool
 */
export function createCloudDeleteFileTool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "Delete Cloud File",
    name: "cloud_delete_file",
    description: "Delete a file from cloud storage. This action cannot be undone.",
    parameters: CloudDeleteFileSchema,
    execute: async (_toolCallId, params) => {
      try {
        const fileId = readStringParam(params, "fileId", { required: true });
        await handler.deleteFile(fileId);

        return jsonResult({
          success: true,
          message: "File deleted successfully.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the cloud_update_file tool
 */
export function createCloudUpdateFileTool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "Update Cloud File",
    name: "cloud_update_file",
    description: `Update a file's properties: rename it, make it public/private, or move to a different folder.

Examples:
- Rename: cloud_update_file(fileId="abc", filename="new-name.txt")
- Make public: cloud_update_file(fileId="abc", isPublic=true)
- Move to folder: cloud_update_file(fileId="abc", folderId="folder-id")
- Move to root: cloud_update_file(fileId="abc", folderId="root")`,
    parameters: CloudUpdateFileSchema,
    execute: async (_toolCallId, params) => {
      try {
        const fileId = readStringParam(params, "fileId", { required: true });
        const filename = readStringParam(params, "filename");
        const folderId = readStringParam(params, "folderId");
        const isPublic = typeof params.isPublic === "boolean" ? params.isPublic : undefined;

        await handler.updateFile(fileId, {
          filename,
          isPublic,
          folderId: folderId === "root" ? null : folderId,
        });

        return jsonResult({
          success: true,
          message: "File updated successfully.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the cloud_create_folder tool
 */
export function createCloudCreateFolderTool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "Create Cloud Folder",
    name: "cloud_create_folder",
    description: "Create a new folder in cloud storage to organize files.",
    parameters: CloudCreateFolderSchema,
    execute: async (_toolCallId, params) => {
      try {
        const name = readStringParam(params, "name", { required: true });
        const parentId = readStringParam(params, "parentId");

        const result = await handler.createFolder(name, parentId);

        return jsonResult({
          success: true,
          folderId: result.id,
          name: result.name,
          message: `Folder "${result.name}" created.`,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the cloud_delete_folder tool
 */
export function createCloudDeleteFolderTool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "Delete Cloud Folder",
    name: "cloud_delete_folder",
    description: "Delete a folder and all files inside it. This action cannot be undone.",
    parameters: CloudDeleteFolderSchema,
    execute: async (_toolCallId, params) => {
      try {
        const folderId = readStringParam(params, "folderId", { required: true });
        await handler.deleteFolder(folderId);

        return jsonResult({
          success: true,
          message: "Folder and its contents deleted.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the cloud_share_file tool
 */
export function createCloudShareFileTool(handler: CloudStorageHandler): AnyAgentTool {
  return {
    label: "Share Cloud File",
    name: "cloud_share_file",
    description: `Make a file public and get a shareable URL. Use this when the user wants to share a file with others.

The returned URL can be shared via messaging, email, etc.`,
    parameters: CloudShareFileSchema,
    execute: async (_toolCallId, params) => {
      try {
        const fileId = readStringParam(params, "fileId", { required: true });

        // First make it public
        await handler.updateFile(fileId, { isPublic: true });

        // Then get the file info with public URL
        const result = await handler.getFile(fileId);
        if (!result) {
          return jsonResult({ error: "File not found" });
        }

        return jsonResult({
          success: true,
          publicUrl: result.file.publicUrl,
          filename: result.file.filename,
          message: `File is now public. Share this URL: ${result.file.publicUrl}`,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create all cloud storage tools
 */
export function createCloudStorageTools(handler: CloudStorageHandler): AnyAgentTool[] {
  return [
    createCloudStorageInfoTool(handler),
    createCloudListFilesTool(handler),
    createCloudListFoldersTool(handler),
    createCloudGetFileTool(handler),
    createCloudReadFileTool(handler),
    createCloudUploadTool(handler),
    createCloudUploadBase64Tool(handler),
    createCloudExtractTextTool(handler),
    createCloudCreateDocumentTool(handler),
    createCloudUpdateFileTool(handler),
    createCloudDeleteFileTool(handler),
    createCloudCreateFolderTool(handler),
    createCloudDeleteFolderTool(handler),
    createCloudShareFileTool(handler),
  ];
}
