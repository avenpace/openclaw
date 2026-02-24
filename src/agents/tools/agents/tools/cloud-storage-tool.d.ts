import type { AnyAgentTool } from "./common.js";
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
    used: {
        bytes: string;
        formatted: string;
    };
    quota: {
        bytes: string;
        formatted: string;
    };
    remaining: {
        bytes: string;
        formatted: string;
    };
    usedPercent: number;
    maxFileSize: {
        bytes: string;
        formatted: string;
    };
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
    }) => Promise<{
        files: CloudFileInfo[];
        total: number;
    }>;
    /** List folders */
    listFolders: (parentId?: string | null) => Promise<{
        folders: CloudFolderInfo[];
    }>;
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
    updateFile: (fileId: string, updates: {
        filename?: string;
        isPublic?: boolean;
        folderId?: string | null;
    }) => Promise<void>;
    /** Create a folder */
    createFolder: (name: string, parentId?: string) => Promise<{
        id: string;
        name: string;
    }>;
    /** Delete a folder */
    deleteFolder: (folderId: string) => Promise<void>;
    /** Create a document (docx/xlsx/pptx/pdf) and save to cloud */
    createDocument: (params: {
        type: "docx" | "xlsx" | "pptx" | "pdf";
        filename?: string;
        title?: string;
        content?: string;
        csv?: string;
        sheets?: Array<{
            name?: string;
            rows: string[][];
        }>;
        slides?: Array<{
            title?: string;
            bullets?: string[];
        }>;
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
/**
 * Create the cloud_storage_info tool
 */
export declare function createCloudStorageInfoTool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create the cloud_list_files tool
 */
export declare function createCloudListFilesTool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create the cloud_list_folders tool
 */
export declare function createCloudListFoldersTool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create the cloud_get_file tool
 */
export declare function createCloudGetFileTool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create the cloud_read_file tool
 */
export declare function createCloudReadFileTool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create the cloud_upload tool
 */
export declare function createCloudUploadTool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create the cloud_upload_base64 tool
 */
export declare function createCloudUploadBase64Tool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create the cloud_extract_text tool
 */
export declare function createCloudExtractTextTool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create the cloud_create_document tool
 */
export declare function createCloudCreateDocumentTool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create the cloud_delete_file tool
 */
export declare function createCloudDeleteFileTool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create the cloud_update_file tool
 */
export declare function createCloudUpdateFileTool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create the cloud_create_folder tool
 */
export declare function createCloudCreateFolderTool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create the cloud_delete_folder tool
 */
export declare function createCloudDeleteFolderTool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create the cloud_share_file tool
 */
export declare function createCloudShareFileTool(handler: CloudStorageHandler): AnyAgentTool;
/**
 * Create all cloud storage tools
 */
export declare function createCloudStorageTools(handler: CloudStorageHandler): AnyAgentTool[];
