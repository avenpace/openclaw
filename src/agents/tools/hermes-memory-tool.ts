import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";

/**
 * Memory update result
 */
export type HermesMemoryResult = {
  success: boolean;
  message?: string;
  error?: string;
  entries?: string[];
  usage?: string;
  entry_count?: number;
};

/**
 * Handler interface for Hermes memory operations
 * Platform provides the implementation that bridges to the Python Hermes service
 */
export type HermesMemoryHandler = {
  /** Update memory (add, replace, or remove entries) */
  updateMemory: (params: {
    action: "add" | "replace" | "remove";
    target: "memory" | "user";
    content?: string;
    oldText?: string;
  }) => Promise<HermesMemoryResult>;

  /** Get current memory content */
  getMemory: (target: "memory" | "user") => Promise<string | null>;
};

const HermesMemoryUpdateSchema = Type.Object({
  action: Type.Union([Type.Literal("add"), Type.Literal("replace"), Type.Literal("remove")], {
    description: "Action to perform: 'add' new entry, 'replace' existing entry, or 'remove' entry",
  }),
  target: Type.Union([Type.Literal("memory"), Type.Literal("user")], {
    description:
      "Target store: 'memory' for your notes/learnings, 'user' for user preferences/facts",
  }),
  content: Type.Optional(
    Type.String({
      description:
        "Content for add/replace action. Format: brief factual entry (e.g., 'User prefers dark mode')",
    }),
  ),
  oldText: Type.Optional(
    Type.String({ description: "Substring to match for replace/remove action" }),
  ),
});

const HermesMemoryReadSchema = Type.Object({
  target: Type.Union([Type.Literal("memory"), Type.Literal("user")], {
    description: "Which store to read: 'memory' or 'user'",
  }),
});

/**
 * Create the hermes_memory_update tool
 * Allows the agent to store learnings and user preferences
 */
export function createHermesMemoryUpdateTool(handler: HermesMemoryHandler): AnyAgentTool {
  return {
    label: "Update Memory",
    name: "hermes_memory_update",
    description: `Store persistent information that persists across conversations.

Use this tool to remember:
- **user**: User preferences, facts about the user, their working style
  Examples: "Prefers formal communication", "Works in finance", "Uses MacOS"
- **memory**: Your own learnings and notes from interactions
  Examples: "User's project uses React 18", "Code style: 2-space indent"

Actions:
- **add**: Add a new entry (use for new information)
- **replace**: Replace an entry matching oldText with new content
- **remove**: Remove an entry matching oldText

Memory is bounded (2,200 chars) - be concise. Entries are delimited by §.

IMPORTANT: Only store factual, useful information. Avoid duplicates.
Check if information already exists before adding.`,
    parameters: HermesMemoryUpdateSchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const action = readStringParam(params, "action", { required: true }) as
          | "add"
          | "replace"
          | "remove";
        const target = readStringParam(params, "target", { required: true }) as "memory" | "user";
        const content = readStringParam(params, "content");
        const oldText = readStringParam(params, "oldText");

        // Validate parameters based on action
        if (action === "add" && !content) {
          return jsonResult({ error: "Content is required for 'add' action" });
        }
        if (action === "replace" && (!content || !oldText)) {
          return jsonResult({
            error: "Both content and oldText are required for 'replace' action",
          });
        }
        if (action === "remove" && !oldText) {
          return jsonResult({ error: "oldText is required for 'remove' action" });
        }

        const result = await handler.updateMemory({
          action,
          target,
          content: content || undefined,
          oldText: oldText || undefined,
        });

        return jsonResult(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the hermes_memory_read tool
 * Allows the agent to read current memory content
 */
export function createHermesMemoryReadTool(handler: HermesMemoryHandler): AnyAgentTool {
  return {
    label: "Read Memory",
    name: "hermes_memory_read",
    description: `Read current memory content to check what's already stored.

Use before adding new information to avoid duplicates.
Returns the raw content of the specified memory store.`,
    parameters: HermesMemoryReadSchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const target = readStringParam(params, "target", { required: true }) as "memory" | "user";
        const content = await handler.getMemory(target);

        return jsonResult({
          target,
          content: content || "(empty)",
          isEmpty: !content || content.trim() === "",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create all Hermes memory tools
 */
export function createHermesMemoryTools(handler: HermesMemoryHandler): AnyAgentTool[] {
  return [createHermesMemoryUpdateTool(handler), createHermesMemoryReadTool(handler)];
}
