import { normalizeAccountId } from "../../routing/session-key.js";
function normalizeConversationRef(ref) {
    return {
        channel: ref.channel.trim().toLowerCase(),
        accountId: normalizeAccountId(ref.accountId),
        conversationId: ref.conversationId.trim(),
        parentConversationId: ref.parentConversationId?.trim() || undefined,
    };
}
function toAdapterKey(params) {
    return `${params.channel.trim().toLowerCase()}:${normalizeAccountId(params.accountId)}`;
}
const ADAPTERS_BY_CHANNEL_ACCOUNT = new Map();
export function registerSessionBindingAdapter(adapter) {
    const key = toAdapterKey({
        channel: adapter.channel,
        accountId: adapter.accountId,
    });
    ADAPTERS_BY_CHANNEL_ACCOUNT.set(key, {
        ...adapter,
        channel: adapter.channel.trim().toLowerCase(),
        accountId: normalizeAccountId(adapter.accountId),
    });
}
export function unregisterSessionBindingAdapter(params) {
    ADAPTERS_BY_CHANNEL_ACCOUNT.delete(toAdapterKey(params));
}
function resolveAdapterForConversation(ref) {
    const normalized = normalizeConversationRef(ref);
    const key = toAdapterKey({
        channel: normalized.channel,
        accountId: normalized.accountId,
    });
    return ADAPTERS_BY_CHANNEL_ACCOUNT.get(key) ?? null;
}
function dedupeBindings(records) {
    const byId = new Map();
    for (const record of records) {
        if (!record?.bindingId) {
            continue;
        }
        byId.set(record.bindingId, record);
    }
    return [...byId.values()];
}
function createDefaultSessionBindingService() {
    return {
        bind: async (input) => {
            const normalizedConversation = normalizeConversationRef(input.conversation);
            const adapter = resolveAdapterForConversation(normalizedConversation);
            if (!adapter?.bind) {
                throw new Error(`Session binding adapter unavailable for ${normalizedConversation.channel}:${normalizedConversation.accountId}`);
            }
            const bound = await adapter.bind({
                ...input,
                conversation: normalizedConversation,
            });
            if (!bound) {
                throw new Error("Session binding adapter failed to bind target conversation");
            }
            return bound;
        },
        listBySession: (targetSessionKey) => {
            const key = targetSessionKey.trim();
            if (!key) {
                return [];
            }
            const results = [];
            for (const adapter of ADAPTERS_BY_CHANNEL_ACCOUNT.values()) {
                const entries = adapter.listBySession(key);
                if (entries.length > 0) {
                    results.push(...entries);
                }
            }
            return dedupeBindings(results);
        },
        resolveByConversation: (ref) => {
            const normalized = normalizeConversationRef(ref);
            if (!normalized.channel || !normalized.conversationId) {
                return null;
            }
            const adapter = resolveAdapterForConversation(normalized);
            if (!adapter) {
                return null;
            }
            return adapter.resolveByConversation(normalized);
        },
        touch: (bindingId, at) => {
            const normalizedBindingId = bindingId.trim();
            if (!normalizedBindingId) {
                return;
            }
            for (const adapter of ADAPTERS_BY_CHANNEL_ACCOUNT.values()) {
                adapter.touch?.(normalizedBindingId, at);
            }
        },
        unbind: async (input) => {
            const removed = [];
            for (const adapter of ADAPTERS_BY_CHANNEL_ACCOUNT.values()) {
                if (!adapter.unbind) {
                    continue;
                }
                const entries = await adapter.unbind(input);
                if (entries.length > 0) {
                    removed.push(...entries);
                }
            }
            return dedupeBindings(removed);
        },
    };
}
const DEFAULT_SESSION_BINDING_SERVICE = createDefaultSessionBindingService();
export function getSessionBindingService() {
    return DEFAULT_SESSION_BINDING_SERVICE;
}
export const __testing = {
    resetSessionBindingAdaptersForTests() {
        ADAPTERS_BY_CHANNEL_ACCOUNT.clear();
    },
    getRegisteredAdapterKeys() {
        return [...ADAPTERS_BY_CHANNEL_ACCOUNT.keys()];
    },
};
//# sourceMappingURL=session-binding-service.js.map