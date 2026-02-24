export declare function formatDurationCompact(valueMs?: number): string;
export declare function formatTokenShort(value?: number): string;
export declare function truncateLine(value: string, maxLength: number): string;
export type TokenUsageLike = {
    totalTokens?: unknown;
    inputTokens?: unknown;
    outputTokens?: unknown;
};
export declare function resolveTotalTokens(entry?: TokenUsageLike): number;
export declare function resolveIoTokens(entry?: TokenUsageLike): {
    input: number;
    output: number;
    total: number;
};
export declare function formatTokenUsageDisplay(entry?: TokenUsageLike): string;
