import type { AgentTool } from "@mariozechner/pi-agent-core";
import type { ClientToolDefinition } from "./run/params.js";
export declare function collectAllowedToolNames(params: {
    tools: AgentTool[];
    clientTools?: ClientToolDefinition[];
}): Set<string>;
//# sourceMappingURL=tool-name-allowlist.d.ts.map