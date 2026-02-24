import type { AnyAgentTool } from "./common.js";
/**
 * Device information returned by the handler
 */
export type DeviceInfo = {
    deviceId: string;
    deviceName?: string;
    platform?: string;
    version?: string;
    lastSeen?: string;
    isDefault?: boolean;
};
/**
 * Job result returned by the handler
 */
export type DeviceJobResult = {
    jobId: string;
    status: string;
    deviceId: string;
};
/**
 * Handler interface that the platform provides
 * This allows the devices tool to interact with platform data
 * without needing HTTP calls or exposed tokens
 */
/**
 * Upload result returned by the handler
 */
export type DeviceUploadResult = {
    url: string;
    mimeType: string;
    sizeBytes: number;
};
/**
 * Send file result returned by the handler
 */
export type DeviceSendFileResult = {
    success: boolean;
    messageId?: string;
    error?: string;
};
/**
 * Find and send file result returned by the handler
 */
export type DeviceFindAndSendResult = {
    success: boolean;
    foundPath?: string;
    messageId?: string;
    error?: string;
};
export type DevicesHandler = {
    /** List all devices for the current user */
    listDevices: () => Promise<{
        devices: DeviceInfo[];
    }>;
    /** Run a command on a specific device */
    runCommand: (params: {
        deviceName?: string;
        deviceId?: string;
        command: string;
    }) => Promise<DeviceJobResult>;
    /** Upload a file from a device */
    uploadFile: (params: {
        deviceName?: string;
        deviceId?: string;
        filePath: string;
    }) => Promise<DeviceUploadResult>;
    /** Upload and send a file from a device via the current channel */
    sendFile?: (params: {
        deviceName?: string;
        deviceId?: string;
        filePath: string;
        caption?: string;
    }) => Promise<DeviceSendFileResult>;
    /** Find a file by pattern and send it via the current channel */
    findAndSendFile?: (params: {
        deviceName?: string;
        deviceId?: string;
        searchPattern: string;
        searchPath?: string;
        caption?: string;
    }) => Promise<DeviceFindAndSendResult>;
    /** Check status of a job */
    getJobStatus: (jobId: string) => Promise<{
        job: {
            id: string;
            status: string;
            result?: string;
            errorText?: string;
        } | null;
    }>;
};
/**
 * Create the devices_list tool
 */
export declare function createDevicesListTool(handler: DevicesHandler): AnyAgentTool;
/**
 * Create the devices_run tool
 */
export declare function createDevicesRunTool(handler: DevicesHandler): AnyAgentTool;
/**
 * Create the devices_job_status tool
 */
export declare function createDevicesJobStatusTool(handler: DevicesHandler): AnyAgentTool;
/**
 * Create the devices_upload tool
 */
export declare function createDevicesUploadTool(handler: DevicesHandler): AnyAgentTool;
/**
 * Create the devices_send_file tool - combined upload and send
 */
export declare function createDevicesSendFileTool(handler: DevicesHandler): AnyAgentTool | null;
/**
 * Create the devices_find_and_send tool - search for a file and send it in one step
 */
export declare function createDevicesFindAndSendTool(handler: DevicesHandler): AnyAgentTool | null;
/**
 * Create all devices tools
 */
export declare function createDevicesTools(handler: DevicesHandler): AnyAgentTool[];
