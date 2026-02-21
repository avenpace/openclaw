import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";

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
  listDevices: () => Promise<{ devices: DeviceInfo[] }>;

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

const DevicesListSchema = Type.Object({});

const DevicesRunSchema = Type.Object({
  device: Type.String({ description: "Device name or ID to run the command on" }),
  command: Type.String({ description: "The command to execute on the device" }),
});

const DevicesJobStatusSchema = Type.Object({
  jobId: Type.String({ description: "The job ID to check status for" }),
});

const DevicesUploadSchema = Type.Object({
  device: Type.String({ description: "Device name or ID to upload from" }),
  filePath: Type.String({ description: "Full path to the file on the device (e.g., ~/Desktop/report.pdf)" }),
});

const DevicesSendFileSchema = Type.Object({
  device: Type.Optional(Type.String({ description: "Device name or ID (uses default if not specified)" })),
  filePath: Type.String({ description: "Full path to the file on the device (e.g., ~/Desktop/report.pdf)" }),
  caption: Type.Optional(Type.String({ description: "Optional message to send with the file" })),
});

const DevicesFindAndSendSchema = Type.Object({
  searchPattern: Type.String({ description: "Search pattern to find the file (e.g., 'cita', 'report', 'invoice2024')" }),
  searchPath: Type.Optional(Type.String({ description: "Directory to search in (default: ~/Desktop)" })),
  device: Type.Optional(Type.String({ description: "Device name or ID (uses default if not specified)" })),
  caption: Type.Optional(Type.String({ description: "Optional message to send with the file" })),
});

/**
 * Create the devices_list tool
 */
export function createDevicesListTool(handler: DevicesHandler): AnyAgentTool {
  return {
    label: "List Devices",
    name: "devices_list",
    description: "List all paired devices for the current user. Returns device names, platforms, and which device is set as default.",
    parameters: DevicesListSchema,
    execute: async () => {
      try {
        const result = await handler.listDevices();
        if (result.devices.length === 0) {
          return jsonResult({
            devices: [],
            message: "No devices paired. Use the Clawku Client app to pair a device.",
          });
        }
        return jsonResult({
          devices: result.devices.map((d) => ({
            name: d.deviceName || d.deviceId,
            platform: d.platform,
            isDefault: d.isDefault,
            lastSeen: d.lastSeen,
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
 * Create the devices_run tool
 */
export function createDevicesRunTool(handler: DevicesHandler): AnyAgentTool {
  return {
    label: "Run on Device",
    name: "devices_run",
    description: `Run a shell command on a paired device. The command will be sent to the device for approval before execution.

Common uses:
- Find files: find ~/Desktop -name "*keyword*" -type f
- List files: ls ~/Documents/*.pdf
- Search by content: grep -l "text" ~/Documents/*.txt

IMPORTANT: After finding a file path, use devices_send_file to send it to the user.`,
    parameters: DevicesRunSchema,
    execute: async (_toolCallId, params) => {
      try {
        const device = readStringParam(params, "device", { required: true });
        const command = readStringParam(params, "command", { required: true });

        const result = await handler.runCommand({
          deviceName: device,
          command,
        });

        return jsonResult({
          jobId: result.jobId,
          status: result.status,
          deviceId: result.deviceId,
          message: `Command sent to device for approval. Job ID: ${result.jobId}`,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the devices_job_status tool
 */
export function createDevicesJobStatusTool(handler: DevicesHandler): AnyAgentTool {
  return {
    label: "Device Job Status",
    name: "devices_job_status",
    description: "Check the status of a command that was sent to a device. Returns the current status and result if completed.",
    parameters: DevicesJobStatusSchema,
    execute: async (_toolCallId, params) => {
      try {
        const jobId = readStringParam(params, "jobId", { required: true });
        const result = await handler.getJobStatus(jobId);

        if (!result.job) {
          return jsonResult({ error: "Job not found" });
        }

        return jsonResult({
          jobId: result.job.id,
          status: result.job.status,
          result: result.job.result,
          error: result.job.errorText,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the devices_upload tool
 */
export function createDevicesUploadTool(handler: DevicesHandler): AnyAgentTool {
  return {
    label: "Upload from Device",
    name: "devices_upload",
    description: `Upload a file from a paired device to make it available for sending via messaging.

Use this tool when the user wants to send a file from their device. Provide the full file path on the device.
Returns a file path that you can use with the message tool's "media" parameter to send the file as an attachment.

IMPORTANT: After uploading, immediately use the message tool with action="send" and media=<returned path> to send the file.
The current channel and target will be used automatically if you're responding to a message.

Example: To send ~/Desktop/report.pdf via WhatsApp:
1. Call devices_upload with filePath="~/Desktop/report.pdf"
2. Call message with action="send", media="<returned path>", message="Here's the file"`,
    parameters: DevicesUploadSchema,
    execute: async (_toolCallId, params) => {
      try {
        const device = readStringParam(params, "device", { required: true });
        const filePath = readStringParam(params, "filePath", { required: true });

        const result = await handler.uploadFile({
          deviceName: device,
          filePath,
        });

        return jsonResult({
          success: true,
          mediaPath: result.url,
          mimeType: result.mimeType,
          sizeBytes: result.sizeBytes,
          message: `File uploaded. Now use the message tool with action="send" and media="${result.url}" to send it.`,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the devices_send_file tool - combined upload and send
 */
export function createDevicesSendFileTool(handler: DevicesHandler): AnyAgentTool | null {
  // Only create this tool if the handler supports sendFile
  if (!handler.sendFile) {
    return null;
  }

  return {
    label: "Send File from Device",
    name: "devices_send_file",
    description: `Send a file from the user's device as an attachment in the current conversation.

WORKFLOW for "send me the file with X in the name":
1. First use devices_run with: find ~/Desktop -iname "*X*" -type f (to find the file path)
2. Then call devices_send_file with the found filePath to send it

Use this tool whenever:
- User asks to send/share a file from their computer
- You found a file path using devices_run and need to send it
- User says "send me that file" after you found it

The device parameter is optional - uses default device if not specified.

Examples:
- "send me report.pdf" → devices_send_file(filePath="~/Desktop/report.pdf")
- "send the cita file" → first find it with devices_run, then send with devices_send_file`,
    parameters: DevicesSendFileSchema,
    execute: async (_toolCallId, params) => {
      try {
        const device = readStringParam(params, "device"); // Optional - uses default if not provided
        const filePath = readStringParam(params, "filePath", { required: true });
        const caption = readStringParam(params, "caption");

        const result = await handler.sendFile!({
          deviceName: device || undefined,
          filePath,
          caption: caption || undefined,
        });

        if (result.success) {
          return jsonResult({
            success: true,
            messageId: result.messageId,
            message: "File sent successfully!",
          });
        } else {
          return jsonResult({
            success: false,
            error: result.error || "Failed to send file",
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the devices_find_and_send tool - search for a file and send it in one step
 */
export function createDevicesFindAndSendTool(handler: DevicesHandler): AnyAgentTool | null {
  if (!handler.findAndSendFile) {
    return null;
  }

  return {
    label: "Find and Send File",
    name: "devices_find_and_send",
    description: `Find a file by name pattern on the user's device and send it directly.

USE THIS TOOL when the user says things like:
- "send me the file with cita in the name"
- "send me the report file"
- "send my invoice pdf"
- "find and send the document about X"

This is a ONE-STEP tool - it searches, finds, and sends the file automatically.
No need to run separate find commands.

Parameters:
- searchPattern: Part of the filename to search for (e.g., "cita", "report", "invoice")
- searchPath: Where to search (default: ~/Desktop, can use ~/Documents, ~/, etc.)
- caption: Optional message to send with the file`,
    parameters: DevicesFindAndSendSchema,
    execute: async (_toolCallId, params) => {
      try {
        const searchPattern = readStringParam(params, "searchPattern", { required: true });
        const searchPath = readStringParam(params, "searchPath");
        const device = readStringParam(params, "device");
        const caption = readStringParam(params, "caption");

        const result = await handler.findAndSendFile!({
          deviceName: device || undefined,
          searchPattern,
          searchPath: searchPath || undefined,
          caption: caption || undefined,
        });

        if (result.success) {
          return jsonResult({
            success: true,
            foundPath: result.foundPath,
            messageId: result.messageId,
            message: `Found and sent: ${result.foundPath}`,
          });
        } else {
          return jsonResult({
            success: false,
            error: result.error || "Failed to find or send file",
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create all devices tools
 */
export function createDevicesTools(handler: DevicesHandler): AnyAgentTool[] {
  const tools: AnyAgentTool[] = [
    createDevicesListTool(handler),
    createDevicesRunTool(handler),
    createDevicesUploadTool(handler),
    createDevicesJobStatusTool(handler),
  ];

  // Add send_file tool if handler supports it
  const sendFileTool = createDevicesSendFileTool(handler);
  if (sendFileTool) {
    tools.push(sendFileTool);
  }

  // Add find_and_send tool if handler supports it
  const findAndSendTool = createDevicesFindAndSendTool(handler);
  if (findAndSendTool) {
    tools.push(findAndSendTool);
  }

  return tools;
}
