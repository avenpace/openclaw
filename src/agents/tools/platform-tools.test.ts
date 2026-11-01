import { describe, expect, it, vi } from "vitest";
import {
  createToolSearchCatalogRef,
  createToolSearchTools,
  resolveToolSearchConfig,
} from "../tool-search.js";
import { applyAgentToolSurfaceCatalog } from "../tool-surface-plan.js";
import { jsonResult, type AnyAgentTool } from "./common.js";
import { createPlatformTools } from "./platform-tools.js";

function fakeTool(name: string): AnyAgentTool {
  return {
    name,
    label: name,
    description: `${name} tool`,
    parameters: { type: "object", properties: {} },
    execute: vi.fn(async () => jsonResult({ name })),
  };
}

describe("host platform tools under tool search", () => {
  const config = { tools: { toolSearch: { enabled: true } } } as never;
  const call = vi.fn(async () => ({ ok: true }));
  const params = { type: "object", properties: {}, additionalProperties: false };

  function surface(tools: AnyAgentTool[]) {
    const catalogRef = createToolSearchCatalogRef();
    const controls = createToolSearchTools({ config, catalogRef });
    return applyAgentToolSurfaceCatalog({
      config,
      catalogRef,
      tools: [...controls, ...tools],
      toolSearchRuntimeConfig: config,
      codeModeControlsEnabled: false,
      toolSearchConfig: resolveToolSearchConfig(config),
      forceDirectMessageTool: false,
    });
  }

  it("keeps a direct host tool visible and leaves the others to search", () => {
    const tools = createPlatformTools({
      tools: [
        { name: "business_apps", description: "Owner apps", parameters: params, direct: true },
        { name: "business_extra", description: "Rarely needed", parameters: params },
      ],
      call,
    });
    const visible = surface([...tools, fakeTool("session_status")]).tools.map((t) => t.name);

    expect(visible).toContain("business_apps");
    expect(visible).not.toContain("business_extra");
    expect(visible).not.toContain("session_status");
  });

  it("does not make a same-named tool direct in a run that never declared it", () => {
    createPlatformTools({
      tools: [
        { name: "business_apps", description: "Owner apps", parameters: params, direct: true },
      ],
      call,
    });
    const visible = surface([fakeTool("other_tool")]).tools.map((t) => t.name);

    expect(visible).not.toContain("business_apps");
    expect(visible).not.toContain("other_tool");
  });
});
