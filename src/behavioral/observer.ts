/**
 * Behavioral Tool Observer
 *
 * Observes tool executions and learns patterns from them.
 * Hooks into OpenClaw's after_tool_call plugin hook.
 */

import crypto from "node:crypto";
import { createSubsystemLogger } from "../logging/subsystem.js";
import type { PluginHookAfterToolCallEvent, PluginHookToolContext } from "../plugins/types.js";
import type { BehavioralStore } from "./storage/store.js";
import type { ToolObservation, PatternContext } from "./types.js";
import { processObservation, type UpdateCycleConfig } from "./update-cycle.js";

const log = createSubsystemLogger("behavioral/observer");

/**
 * Configuration for the behavioral observer
 */
export interface BehavioralObserverConfig {
  /** Whether observation is enabled */
  enabled: boolean;

  /** Minimum duration to consider for timing patterns (ms) */
  minDurationForTiming: number;

  /** Tools to exclude from observation */
  excludedTools: string[];

  /** Update cycle config overrides */
  updateCycleConfig?: Partial<UpdateCycleConfig>;
}

const DEFAULT_OBSERVER_CONFIG: BehavioralObserverConfig = {
  enabled: true,
  minDurationForTiming: 100,
  excludedTools: [
    // Internal/meta tools that don't need pattern learning
    "web_search", // Already optimized
    "memory", // Handled separately
    "sessions", // Internal
  ],
  updateCycleConfig: {},
};

/**
 * Behavioral Observer
 *
 * Monitors tool executions and processes them through the learning cycle.
 */
export class BehavioralObserver {
  private config: BehavioralObserverConfig;
  private store: BehavioralStore;
  private pendingObservations: Map<string, ToolObservation> = new Map();

  constructor(store: BehavioralStore, config: Partial<BehavioralObserverConfig> = {}) {
    this.store = store;
    this.config = { ...DEFAULT_OBSERVER_CONFIG, ...config };

    log.info("BehavioralObserver initialized");
  }

  /**
   * Check if a tool should be observed
   */
  private shouldObserve(toolName: string): boolean {
    if (!this.config.enabled) {
      return false;
    }
    return !this.config.excludedTools.includes(toolName);
  }

  /**
   * Create a hook handler for after_tool_call events
   *
   * This returns a function that can be registered as a plugin hook.
   */
  createAfterToolCallHandler(): (
    event: PluginHookAfterToolCallEvent,
    ctx: PluginHookToolContext,
  ) => Promise<void> {
    return async (event, ctx) => {
      await this.handleAfterToolCall(event, ctx);
    };
  }

  /**
   * Handle after_tool_call event
   *
   * Converts the event to an observation and processes it.
   */
  async handleAfterToolCall(
    event: PluginHookAfterToolCallEvent,
    ctx: PluginHookToolContext,
  ): Promise<void> {
    const toolName = normalizeToolName(event.toolName);

    if (!this.shouldObserve(toolName)) {
      log.debug("Skipping observation for tool:", toolName);
      return;
    }

    // Need personaId from context (agentId is the persona ID in our platform)
    const personaId = ctx.agentId;
    if (!personaId) {
      log.debug("No personaId in context, skipping observation");
      return;
    }

    // Build observation from event
    const observation = this.buildObservation(event, ctx, personaId);

    // Process through update cycle
    try {
      const result = await processObservation(
        observation,
        this.store,
        this.config.updateCycleConfig,
      );

      if (result.decision.action !== "NOOP") {
        log.debug(`Processed observation: tool=${toolName} action=${result.decision.action}`);
      }
    } catch (err) {
      log.warn("Failed to process observation:", err);
    }
  }

  /**
   * Build a ToolObservation from hook event
   */
  private buildObservation(
    event: PluginHookAfterToolCallEvent,
    ctx: PluginHookToolContext,
    personaId: string,
  ): ToolObservation {
    const toolName = normalizeToolName(event.toolName);
    const params = event.params || {};

    // Extract context from params
    const context = this.extractContext(toolName, params);

    // Determine action from params (tool-specific)
    const action = this.extractAction(toolName, params);

    // Calculate retry count from duration if available
    const retryCount = this.estimateRetryCount(event.durationMs);

    return {
      id: crypto.randomUUID(),
      personaId,
      timestamp: new Date(),

      tool: toolName,
      action,
      params: params,

      context,

      success: !event.error,
      result: event.result,
      error: event.error
        ? {
            type: "tool_error",
            message: event.error,
          }
        : undefined,

      durationMs: event.durationMs || 0,
      retryCount,
    };
  }

  /**
   * Extract context from tool parameters
   */
  private extractContext(toolName: string, params: Record<string, unknown>): PatternContext {
    const context: PatternContext = {};

    // Browser tool context
    if (toolName === "browser" || toolName === "browser_action") {
      const url = params.url as string | undefined;
      if (url) {
        context.domain = extractDomain(url);
        context.pageType = inferPageType(url);
      }
      const elementType = params.elementType as string | undefined;
      if (elementType) {
        context.elementType = elementType;
      }
    }

    // Device tool context
    if (toolName === "device" || toolName === "devices_run") {
      const command = params.command as string | undefined;
      if (command) {
        context.os = inferOsFromCommand(command);
      }
    }

    // Message tool context
    if (toolName === "message" || toolName === "messaging") {
      const channel = params.channel as string | undefined;
      if (channel) {
        context.channel = channel;
      }
    }

    // Skill context
    if (toolName.startsWith("skill:")) {
      context.skillId = toolName.replace("skill:", "");
    }

    return context;
  }

  /**
   * Extract action from tool parameters
   */
  private extractAction(toolName: string, params: Record<string, unknown>): string | undefined {
    // Action is often passed as a parameter
    if (params.action && typeof params.action === "string") {
      return params.action;
    }

    // For browser tool, infer from other params
    if (toolName === "browser" || toolName === "browser_action") {
      if (params.selector && params.text) {
        return "type";
      }
      if (params.selector) {
        return "click";
      }
      if (params.url) {
        return "navigate";
      }
      if (params.screenshot) {
        return "screenshot";
      }
    }

    // For device tool
    if (toolName === "device" || toolName === "devices_run") {
      if (params.command) {
        return "run_command";
      }
    }

    // For message tool
    if (toolName === "message" || toolName === "messaging") {
      if (params.message) {
        return "send";
      }
    }

    return undefined;
  }

  /**
   * Estimate retry count from duration (rough heuristic)
   */
  private estimateRetryCount(durationMs?: number): number | undefined {
    if (!durationMs || durationMs < this.config.minDurationForTiming) {
      return undefined;
    }

    // Assume each retry adds ~1000ms
    // If duration > 3000ms, likely had retries
    if (durationMs > 3000) {
      return Math.floor((durationMs - 1000) / 1000);
    }

    return 0;
  }

  /**
   * Manually record an observation (for external callers)
   */
  async recordObservation(observation: ToolObservation): Promise<void> {
    try {
      await processObservation(observation, this.store, this.config.updateCycleConfig);
    } catch (err) {
      log.warn("Failed to record observation:", err);
    }
  }

  /**
   * Get observer stats
   */
  getStats() {
    return {
      enabled: this.config.enabled,
      excludedTools: this.config.excludedTools,
      storeStats: this.store.getStats(),
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Normalize tool name (remove prefixes, lowercase)
 */
function normalizeToolName(name: string): string {
  return name.toLowerCase().replace(/^(tool_|mcp_)/, "");
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      return parts.slice(-2).join(".");
    }
    return hostname;
  } catch {
    return undefined;
  }
}

/**
 * Infer page type from URL
 */
function inferPageType(url: string): string | undefined {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("/login") || lowerUrl.includes("/signin")) {
    return "login";
  }
  if (lowerUrl.includes("/search")) {
    return "search";
  }
  if (lowerUrl.includes("/profile") || lowerUrl.includes("/user/")) {
    return "profile";
  }
  if (lowerUrl.includes("/settings")) {
    return "settings";
  }

  return undefined;
}

/**
 * Infer OS from command patterns
 */
function inferOsFromCommand(command: string): string {
  if (command.includes("osascript") || command.includes("/Applications/")) {
    return "macos";
  }
  if (command.includes("powershell") || command.includes("cmd.exe") || command.includes("\\")) {
    return "windows";
  }
  if (command.includes("/usr/") || command.includes("apt") || command.includes("systemctl")) {
    return "linux";
  }

  return "unix";
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create a behavioral observer with default configuration
 */
export function createBehavioralObserver(
  store: BehavioralStore,
  config?: Partial<BehavioralObserverConfig>,
): BehavioralObserver {
  return new BehavioralObserver(store, config);
}
