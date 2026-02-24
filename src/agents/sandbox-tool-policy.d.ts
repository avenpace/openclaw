import type { SandboxToolPolicy } from "./sandbox/types.js";
type SandboxToolPolicyConfig = {
    allow?: string[];
    alsoAllow?: string[];
    deny?: string[];
};
export declare function pickSandboxToolPolicy(config?: SandboxToolPolicyConfig): SandboxToolPolicy | undefined;

//# sourceMappingURL=sandbox-tool-policy.d.ts.map