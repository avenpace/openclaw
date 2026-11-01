import { Type } from "typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult } from "./common.js";

/**
 * Host-defined tools (Clawku platform).
 *
 * The embedding platform describes each tool (name, description, JSON-schema
 * parameters) and executes it itself, so new platform capabilities do not need
 * an OpenClaw change. The host decides per run which tools exist; authority
 * (who may read or change what) is enforced by the host's `call`, never by the
 * model's arguments.
 */
export type PlatformToolSpec = {
  name: string;
  label?: string;
  description: string;
  /** JSON schema of the arguments object. */
  parameters: Record<string, unknown>;
};

export type PlatformToolsHandler = {
  tools: PlatformToolSpec[];
  call: (name: string, args: Record<string, unknown>) => Promise<unknown>;
};

export function createPlatformTools(handler: PlatformToolsHandler): AnyAgentTool[] {
  return handler.tools.map((spec): AnyAgentTool => ({
    name: spec.name,
    label: spec.label ?? spec.name,
    description: spec.description,
    parameters: Type.Unsafe<Record<string, unknown>>(spec.parameters),
    execute: async (_id, raw) => {
      try {
        return jsonResult(await handler.call(spec.name, (raw ?? {}) as Record<string, unknown>));
      } catch (err) {
        return jsonResult({ error: err instanceof Error ? err.message : String(err) });
      }
    },
  }));
}
