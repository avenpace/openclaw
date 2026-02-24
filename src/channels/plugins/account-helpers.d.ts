import type { OpenClawConfig } from "../../config/config.js";
export declare function createAccountListHelpers(channelKey: string): {
    listConfiguredAccountIds: (cfg: OpenClawConfig) => string[];
    listAccountIds: (cfg: OpenClawConfig) => string[];
    resolveDefaultAccountId: (cfg: OpenClawConfig) => string;
};
//# sourceMappingURL=account-helpers.d.ts.map