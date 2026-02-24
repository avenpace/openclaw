export type QueuedFileWriter = {
    filePath: string;
    write: (line: string) => void;
};
export declare function getQueuedFileWriter(writers: Map<string, QueuedFileWriter>, filePath: string): QueuedFileWriter;
//# sourceMappingURL=queued-file-writer.d.ts.map