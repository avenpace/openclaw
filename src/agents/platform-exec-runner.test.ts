import { afterEach, describe, expect, it, vi } from "vitest";
import { createExecTool } from "./bash-tools.exec-run.js";
import { setPlatformExecRunner, type PlatformSandboxContext } from "./platform-exec-runner.js";

const sandbox: PlatformSandboxContext = {
  userRoot: "/srv/u1",
  defaultCwd: "/srv/u1/p1",
  personaId: "p1",
};

describe("platform sandbox exec (Clawku)", () => {
  afterEach(() => setPlatformExecRunner(undefined));

  it("hands every command to the registered runner and returns its output", async () => {
    const runner = vi.fn(async () => ({ output: "sandboxed", exitCode: 0, durationMs: 1 }));
    setPlatformExecRunner(runner);
    const tool = createExecTool({ security: "full", ask: "off", platformSandbox: sandbox });
    const result: any = await tool.execute("c1", { command: "id" } as never);
    expect(runner).toHaveBeenCalledWith(sandbox, expect.objectContaining({ command: "id" }));
    expect(result.content[0].text).toBe("sandboxed");
    expect(result.details.status).toBe("completed");
  });

  it("fails closed when the run asks for the sandbox and no runner is registered", async () => {
    const tool = createExecTool({ security: "full", ask: "off", platformSandbox: sandbox });
    await expect(tool.execute("c2", { command: "id" } as never)).rejects.toThrow(
      /platform sandbox is not running/,
    );
  });

  it("is plain data, so run authority can be structured-cloned", () => {
    expect(() => structuredClone({ platformSandbox: sandbox, host: "gateway" })).not.toThrow();
  });
});
