import { z } from "zod";
export declare const WhatsAppAccountSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        worker: "worker";
        inline: "inline";
    }>>>;
    worker: z.ZodOptional<z.ZodObject<{
        maxWorkers: z.ZodOptional<z.ZodNumber>;
        docker: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            image: z.ZodOptional<z.ZodString>;
            imageByAccount: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            authMountPath: z.ZodOptional<z.ZodString>;
            workerEntry: z.ZodOptional<z.ZodString>;
            command: z.ZodOptional<z.ZodArray<z.ZodString>>;
            containerNamePrefix: z.ZodOptional<z.ZodString>;
            network: z.ZodOptional<z.ZodString>;
            extraArgs: z.ZodOptional<z.ZodArray<z.ZodString>>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }>>;
    }>>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    markdown: z.ZodOptional<z.ZodObject<{
        tables: z.ZodOptional<z.ZodEnum<{
            code: "code";
            off: "off";
            bullets: "bullets";
        }>>;
    }>>;
    configWrites: z.ZodOptional<z.ZodBoolean>;
    sendReadReceipts: z.ZodOptional<z.ZodBoolean>;
    messagePrefix: z.ZodOptional<z.ZodString>;
    responsePrefix: z.ZodOptional<z.ZodString>;
    dmPolicy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        open: "open";
        allowlist: "allowlist";
        disabled: "disabled";
        pairing: "pairing";
    }>>>;
    selfChatMode: z.ZodOptional<z.ZodBoolean>;
    allowFrom: z.ZodOptional<z.ZodArray<z.ZodString>>;
    defaultTo: z.ZodOptional<z.ZodString>;
    groupAllowFrom: z.ZodOptional<z.ZodArray<z.ZodString>>;
    groupPolicy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        open: "open";
        allowlist: "allowlist";
        disabled: "disabled";
    }>>>;
    historyLimit: z.ZodOptional<z.ZodNumber>;
    dmHistoryLimit: z.ZodOptional<z.ZodNumber>;
    dms: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
        historyLimit: z.ZodOptional<z.ZodNumber>;
    }>>>>;
    textChunkLimit: z.ZodOptional<z.ZodNumber>;
    chunkMode: z.ZodOptional<z.ZodEnum<{
        length: "length";
        newline: "newline";
    }>>;
    blockStreaming: z.ZodOptional<z.ZodBoolean>;
    blockStreamingCoalesce: z.ZodOptional<z.ZodObject<{
        minChars: z.ZodOptional<z.ZodNumber>;
        maxChars: z.ZodOptional<z.ZodNumber>;
        idleMs: z.ZodOptional<z.ZodNumber>;
    }>>;
    groups: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
        requireMention: z.ZodOptional<z.ZodBoolean>;
        tools: z.ZodOptional<z.ZodObject<{
            allow: z.ZodOptional<z.ZodArray<z.ZodString>>;
            alsoAllow: z.ZodOptional<z.ZodArray<z.ZodString>>;
            deny: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }>>;
        toolsBySender: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
            allow: z.ZodOptional<z.ZodArray<z.ZodString>>;
            alsoAllow: z.ZodOptional<z.ZodArray<z.ZodString>>;
            deny: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }>>>>;
    }>>>>;
    ackReaction: z.ZodOptional<z.ZodObject<{
        emoji: z.ZodOptional<z.ZodString>;
        direct: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        group: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            never: "never";
            always: "always";
            mentions: "mentions";
        }>>>;
    }>>;
    debounceMs: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    heartbeat: z.ZodOptional<z.ZodObject<{
        showOk: z.ZodOptional<z.ZodBoolean>;
        showAlerts: z.ZodOptional<z.ZodBoolean>;
        useIndicator: z.ZodOptional<z.ZodBoolean>;
    }>>;
    name: z.ZodOptional<z.ZodString>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    authDir: z.ZodOptional<z.ZodString>;
    mediaMaxMb: z.ZodOptional<z.ZodNumber>;
}>;
export declare const WhatsAppConfigSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        worker: "worker";
        inline: "inline";
    }>>>;
    worker: z.ZodOptional<z.ZodObject<{
        maxWorkers: z.ZodOptional<z.ZodNumber>;
        docker: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            image: z.ZodOptional<z.ZodString>;
            imageByAccount: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            authMountPath: z.ZodOptional<z.ZodString>;
            workerEntry: z.ZodOptional<z.ZodString>;
            command: z.ZodOptional<z.ZodArray<z.ZodString>>;
            containerNamePrefix: z.ZodOptional<z.ZodString>;
            network: z.ZodOptional<z.ZodString>;
            extraArgs: z.ZodOptional<z.ZodArray<z.ZodString>>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }>>;
    }>>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    markdown: z.ZodOptional<z.ZodObject<{
        tables: z.ZodOptional<z.ZodEnum<{
            code: "code";
            off: "off";
            bullets: "bullets";
        }>>;
    }>>;
    configWrites: z.ZodOptional<z.ZodBoolean>;
    sendReadReceipts: z.ZodOptional<z.ZodBoolean>;
    messagePrefix: z.ZodOptional<z.ZodString>;
    responsePrefix: z.ZodOptional<z.ZodString>;
    dmPolicy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        open: "open";
        allowlist: "allowlist";
        disabled: "disabled";
        pairing: "pairing";
    }>>>;
    selfChatMode: z.ZodOptional<z.ZodBoolean>;
    allowFrom: z.ZodOptional<z.ZodArray<z.ZodString>>;
    defaultTo: z.ZodOptional<z.ZodString>;
    groupAllowFrom: z.ZodOptional<z.ZodArray<z.ZodString>>;
    groupPolicy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        open: "open";
        allowlist: "allowlist";
        disabled: "disabled";
    }>>>;
    historyLimit: z.ZodOptional<z.ZodNumber>;
    dmHistoryLimit: z.ZodOptional<z.ZodNumber>;
    dms: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
        historyLimit: z.ZodOptional<z.ZodNumber>;
    }>>>>;
    textChunkLimit: z.ZodOptional<z.ZodNumber>;
    chunkMode: z.ZodOptional<z.ZodEnum<{
        length: "length";
        newline: "newline";
    }>>;
    blockStreaming: z.ZodOptional<z.ZodBoolean>;
    blockStreamingCoalesce: z.ZodOptional<z.ZodObject<{
        minChars: z.ZodOptional<z.ZodNumber>;
        maxChars: z.ZodOptional<z.ZodNumber>;
        idleMs: z.ZodOptional<z.ZodNumber>;
    }>>;
    groups: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
        requireMention: z.ZodOptional<z.ZodBoolean>;
        tools: z.ZodOptional<z.ZodObject<{
            allow: z.ZodOptional<z.ZodArray<z.ZodString>>;
            alsoAllow: z.ZodOptional<z.ZodArray<z.ZodString>>;
            deny: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }>>;
        toolsBySender: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
            allow: z.ZodOptional<z.ZodArray<z.ZodString>>;
            alsoAllow: z.ZodOptional<z.ZodArray<z.ZodString>>;
            deny: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }>>>>;
    }>>>>;
    ackReaction: z.ZodOptional<z.ZodObject<{
        emoji: z.ZodOptional<z.ZodString>;
        direct: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        group: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            never: "never";
            always: "always";
            mentions: "mentions";
        }>>>;
    }>>;
    debounceMs: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    heartbeat: z.ZodOptional<z.ZodObject<{
        showOk: z.ZodOptional<z.ZodBoolean>;
        showAlerts: z.ZodOptional<z.ZodBoolean>;
        useIndicator: z.ZodOptional<z.ZodBoolean>;
    }>>;
    accounts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
        mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            worker: "worker";
            inline: "inline";
        }>>>;
        worker: z.ZodOptional<z.ZodObject<{
            maxWorkers: z.ZodOptional<z.ZodNumber>;
            docker: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodOptional<z.ZodBoolean>;
                image: z.ZodOptional<z.ZodString>;
                imageByAccount: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
                authMountPath: z.ZodOptional<z.ZodString>;
                workerEntry: z.ZodOptional<z.ZodString>;
                command: z.ZodOptional<z.ZodArray<z.ZodString>>;
                containerNamePrefix: z.ZodOptional<z.ZodString>;
                network: z.ZodOptional<z.ZodString>;
                extraArgs: z.ZodOptional<z.ZodArray<z.ZodString>>;
                env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            }>>;
        }>>;
        capabilities: z.ZodOptional<z.ZodArray<z.ZodString>>;
        markdown: z.ZodOptional<z.ZodObject<{
            tables: z.ZodOptional<z.ZodEnum<{
                code: "code";
                off: "off";
                bullets: "bullets";
            }>>;
        }>>;
        configWrites: z.ZodOptional<z.ZodBoolean>;
        sendReadReceipts: z.ZodOptional<z.ZodBoolean>;
        messagePrefix: z.ZodOptional<z.ZodString>;
        responsePrefix: z.ZodOptional<z.ZodString>;
        dmPolicy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            open: "open";
            allowlist: "allowlist";
            disabled: "disabled";
            pairing: "pairing";
        }>>>;
        selfChatMode: z.ZodOptional<z.ZodBoolean>;
        allowFrom: z.ZodOptional<z.ZodArray<z.ZodString>>;
        defaultTo: z.ZodOptional<z.ZodString>;
        groupAllowFrom: z.ZodOptional<z.ZodArray<z.ZodString>>;
        groupPolicy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
            open: "open";
            allowlist: "allowlist";
            disabled: "disabled";
        }>>>;
        historyLimit: z.ZodOptional<z.ZodNumber>;
        dmHistoryLimit: z.ZodOptional<z.ZodNumber>;
        dms: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
            historyLimit: z.ZodOptional<z.ZodNumber>;
        }>>>>;
        textChunkLimit: z.ZodOptional<z.ZodNumber>;
        chunkMode: z.ZodOptional<z.ZodEnum<{
            length: "length";
            newline: "newline";
        }>>;
        blockStreaming: z.ZodOptional<z.ZodBoolean>;
        blockStreamingCoalesce: z.ZodOptional<z.ZodObject<{
            minChars: z.ZodOptional<z.ZodNumber>;
            maxChars: z.ZodOptional<z.ZodNumber>;
            idleMs: z.ZodOptional<z.ZodNumber>;
        }>>;
        groups: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
            requireMention: z.ZodOptional<z.ZodBoolean>;
            tools: z.ZodOptional<z.ZodObject<{
                allow: z.ZodOptional<z.ZodArray<z.ZodString>>;
                alsoAllow: z.ZodOptional<z.ZodArray<z.ZodString>>;
                deny: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }>>;
            toolsBySender: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodOptional<z.ZodObject<{
                allow: z.ZodOptional<z.ZodArray<z.ZodString>>;
                alsoAllow: z.ZodOptional<z.ZodArray<z.ZodString>>;
                deny: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }>>>>;
        }>>>>;
        ackReaction: z.ZodOptional<z.ZodObject<{
            emoji: z.ZodOptional<z.ZodString>;
            direct: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
            group: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
                never: "never";
                always: "always";
                mentions: "mentions";
            }>>>;
        }>>;
        debounceMs: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        heartbeat: z.ZodOptional<z.ZodObject<{
            showOk: z.ZodOptional<z.ZodBoolean>;
            showAlerts: z.ZodOptional<z.ZodBoolean>;
            useIndicator: z.ZodOptional<z.ZodBoolean>;
        }>>;
        name: z.ZodOptional<z.ZodString>;
        enabled: z.ZodOptional<z.ZodBoolean>;
        authDir: z.ZodOptional<z.ZodString>;
        mediaMaxMb: z.ZodOptional<z.ZodNumber>;
    }>>>>;
    mediaMaxMb: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    actions: z.ZodOptional<z.ZodObject<{
        reactions: z.ZodOptional<z.ZodBoolean>;
        sendMessage: z.ZodOptional<z.ZodBoolean>;
        polls: z.ZodOptional<z.ZodBoolean>;
    }>>;
}>;
//# sourceMappingURL=zod-schema.providers-whatsapp.d.ts.map