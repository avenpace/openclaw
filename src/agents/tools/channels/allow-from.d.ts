export declare function mergeAllowFromSources(params: {
    allowFrom?: Array<string | number>;
    storeAllowFrom?: string[];
    dmPolicy?: string;
}): string[];
export declare function firstDefined<T>(...values: Array<T | undefined>): T;
export declare function isSenderIdAllowed(allow: {
    entries: string[];
    hasWildcard: boolean;
    hasEntries: boolean;
}, senderId: string | undefined, allowWhenEmpty: boolean): boolean;
