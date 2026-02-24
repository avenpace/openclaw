export declare const ALLOWED_LOG_LEVELS: readonly ["silent", "fatal", "error", "warn", "info", "debug", "trace"];
export type LogLevel = (typeof ALLOWED_LOG_LEVELS)[number];
export declare function tryParseLogLevel(level?: string): LogLevel | undefined;
export declare function normalizeLogLevel(level?: string, fallback?: LogLevel): "info" | "error" | "debug" | "fatal" | "warn" | "trace" | "silent";
export declare function levelToMinLevel(level: LogLevel): number;
//# sourceMappingURL=levels.d.ts.map