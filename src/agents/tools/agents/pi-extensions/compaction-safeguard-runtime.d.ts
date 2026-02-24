export type CompactionSafeguardRuntimeValue = {
    maxHistoryShare?: number;
    contextWindowTokens?: number;
};
export declare const setCompactionSafeguardRuntime: (sessionManager: unknown, value: CompactionSafeguardRuntimeValue) => void;
export declare const getCompactionSafeguardRuntime: (sessionManager: unknown) => CompactionSafeguardRuntimeValue;
