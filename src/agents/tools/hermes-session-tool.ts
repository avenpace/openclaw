import { Type } from "typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readToolStringParam } from "./common.js";

/**
 * Search over the persona's own conversation history.
 *
 * This is the other half of context compaction. Compaction stops resending old
 * turns to the model, but it never deletes them — they stay in the session
 * store and in the Hermes session index. Without a way to look them up, a
 * compacted conversation would be indistinguishable from a forgotten one. This
 * tool is that lookup.
 *
 * Platform-api supplies the handler (it bridges to the Python Hermes service);
 * no handler means the tool is simply not offered.
 */
export type HermesSessionSearchResultEntry = {
  role?: string;
  snippet?: string;
  timestamp?: number;
  session_id?: string;
  source?: string;
  context?: Array<{ role?: string; content?: string }>;
};

export type HermesSessionSearchResult = {
  success: boolean;
  results?: HermesSessionSearchResultEntry[];
  error?: string;
};

export type SessionSearchHandler = {
  search: (query: string, opts?: { limit?: number }) => Promise<HermesSessionSearchResult>;
};

const HermesSessionSearchSchema = Type.Object({
  query: Type.String({
    description:
      "Words to search for in your own past conversations. Keywords work better than whole sentences.",
  }),
  limit: Type.Optional(
    Type.Number({
      description: "Maximum number of matching messages to return (default 10, max 50).",
    }),
  ),
});

/** Create the hermes_session_search tool. */
export function createHermesSessionSearchTool(handler: SessionSearchHandler): AnyAgentTool {
  return {
    label: "Search Conversation History",
    name: "hermes_session_search",
    description: `Search your own earlier conversations with this user.

Your prompt only carries recent turns plus a summary of what came before, so
older details are NOT in front of you even though they were said. Use this tool
whenever the user refers to something from earlier that you cannot see:
a decision, a preference, a number, a name, an instruction, "what we agreed",
"like last time", "the one I mentioned before".

Returns matching messages with surrounding context. Search before saying you do
not remember something — and if this returns nothing, say that you could not
find it rather than inventing an answer.`,
    parameters: HermesSessionSearchSchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const query = readToolStringParam(params, "query", { required: true }) as string;
        const rawLimit = params.limit;
        const requested =
          typeof rawLimit === "number" && Number.isFinite(rawLimit) ? rawLimit : undefined;
        const limit = Math.min(Math.max(1, Math.floor(requested ?? 10)), 50);

        const result = await handler.search(query, { limit });
        if (!result.success) {
          return jsonResult({ error: result.error ?? "session search failed" });
        }

        const results = result.results ?? [];
        return jsonResult({
          query,
          matchCount: results.length,
          // Say so explicitly: an empty array is easy for a model to read as
          // "the tool broke" and then answer from imagination instead.
          ...(results.length === 0
            ? { note: "No earlier message matched this query." }
            : { results }),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/** Create all Hermes session tools. */
export function createHermesSessionTools(handler: SessionSearchHandler): AnyAgentTool[] {
  return [createHermesSessionSearchTool(handler)];
}
