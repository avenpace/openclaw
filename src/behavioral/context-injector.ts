/**
 * Behavioral Context Injector
 *
 * Injects relevant behavioral patterns into agent prompts.
 * Hooks into OpenClaw's before_prompt_build plugin hook.
 */

import { createSubsystemLogger } from "../logging/subsystem.js";
import type {
  PluginHookBeforePromptBuildEvent,
  PluginHookBeforePromptBuildResult,
  PluginHookAgentContext,
} from "../plugins/types.js";
import type { BehavioralStore } from "./storage/store.js";
import type {
  BehavioralPattern,
  PatternContext,
  InputMethodPattern,
  SelectorPattern,
  CommandPattern,
  PathPattern,
  TimingPattern,
  ErrorRecoveryPattern,
  PreferencePattern,
} from "./types.js";

const log = createSubsystemLogger("behavioral/context-injector");

/**
 * Configuration for context injection
 */
export interface ContextInjectorConfig {
  /** Whether injection is enabled */
  enabled: boolean;

  /** Maximum patterns to include per tool */
  maxPatternsPerTool: number;

  /** Maximum total patterns to include */
  maxTotalPatterns: number;

  /** Minimum confidence to include a pattern */
  minConfidence: number;

  /** Tools to provide hints for */
  targetTools: string[];
}

const DEFAULT_INJECTOR_CONFIG: ContextInjectorConfig = {
  enabled: true,
  maxPatternsPerTool: 3,
  maxTotalPatterns: 10,
  minConfidence: 0.4,
  targetTools: ["browser", "device", "devices_run", "message", "messaging"],
};

/**
 * Context Injector
 *
 * Queries relevant patterns and formats them for injection into prompts.
 */
export class ContextInjector {
  private config: ContextInjectorConfig;
  private store: BehavioralStore;

  constructor(store: BehavioralStore, config: Partial<ContextInjectorConfig> = {}) {
    this.store = store;
    this.config = { ...DEFAULT_INJECTOR_CONFIG, ...config };

    log.info("ContextInjector initialized");
  }

  /**
   * Create a hook handler for before_prompt_build events
   */
  createBeforePromptBuildHandler(): (
    event: PluginHookBeforePromptBuildEvent,
    ctx: PluginHookAgentContext,
  ) => Promise<PluginHookBeforePromptBuildResult | void> {
    return async (event, ctx) => {
      return this.handleBeforePromptBuild(event, ctx);
    };
  }

  /**
   * Handle before_prompt_build event
   */
  async handleBeforePromptBuild(
    event: PluginHookBeforePromptBuildEvent,
    ctx: PluginHookAgentContext,
  ): Promise<PluginHookBeforePromptBuildResult | void> {
    if (!this.config.enabled) {
      return;
    }

    const personaId = ctx.agentId;
    if (!personaId) {
      log.debug("No personaId in context, skipping injection");
      return;
    }

    // Analyze the prompt to determine what tools might be used
    const targetContext = this.analyzePromptForContext(event.prompt);

    // Gather relevant patterns
    const patterns = this.gatherRelevantPatterns(personaId, targetContext);

    if (patterns.length === 0) {
      return;
    }

    // Format patterns into prompt context
    const contextSection = this.formatPatternsAsContext(patterns);

    if (!contextSection) {
      return;
    }

    log.debug(`Injecting ${patterns.length} behavioral hints`);

    return {
      appendSystemContext: contextSection,
    };
  }

  /**
   * Analyze prompt to determine likely context
   */
  private analyzePromptForContext(prompt: string): Partial<PatternContext> {
    const context: Partial<PatternContext> = {};
    const lowerPrompt = prompt.toLowerCase();

    // Detect likely domain from URLs in prompt
    const urlMatch = prompt.match(/https?:\/\/([^\s/]+)/);
    if (urlMatch) {
      const hostname = urlMatch[1];
      const parts = hostname.split(".");
      if (parts.length >= 2) {
        context.domain = parts.slice(-2).join(".");
      }
    }

    // Detect likely page type from keywords
    if (
      lowerPrompt.includes("login") ||
      lowerPrompt.includes("sign in") ||
      lowerPrompt.includes("authenticate")
    ) {
      context.pageType = "login";
    } else if (lowerPrompt.includes("search") || lowerPrompt.includes("find")) {
      context.pageType = "search";
    }

    // Detect OS context
    if (
      lowerPrompt.includes("mac") ||
      lowerPrompt.includes("macos") ||
      lowerPrompt.includes("applescript")
    ) {
      context.os = "macos";
    } else if (lowerPrompt.includes("windows") || lowerPrompt.includes("powershell")) {
      context.os = "windows";
    } else if (
      lowerPrompt.includes("linux") ||
      lowerPrompt.includes("ubuntu") ||
      lowerPrompt.includes("apt")
    ) {
      context.os = "linux";
    }

    // Detect channel context
    if (lowerPrompt.includes("whatsapp")) {
      context.channel = "whatsapp";
    } else if (lowerPrompt.includes("telegram")) {
      context.channel = "telegram";
    } else if (lowerPrompt.includes("discord")) {
      context.channel = "discord";
    } else if (lowerPrompt.includes("slack")) {
      context.channel = "slack";
    }

    return context;
  }

  /**
   * Gather relevant patterns for the context
   */
  private gatherRelevantPatterns(
    personaId: string,
    context: Partial<PatternContext>,
  ): BehavioralPattern[] {
    const allPatterns: BehavioralPattern[] = [];

    for (const tool of this.config.targetTools) {
      const patterns = this.store.getRelevantPatterns({
        tool,
        context,
        personaId,
        limit: this.config.maxPatternsPerTool,
      });

      allPatterns.push(...patterns);
    }

    // Filter by confidence and limit total
    return allPatterns
      .filter((p) => p.confidence >= this.config.minConfidence)
      .toSorted((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxTotalPatterns);
  }

  /**
   * Format patterns as context for system prompt
   */
  private formatPatternsAsContext(patterns: BehavioralPattern[]): string | undefined {
    if (patterns.length === 0) {
      return undefined;
    }

    const sections: string[] = [];

    // Group patterns by tool
    const byTool = new Map<string, BehavioralPattern[]>();
    for (const pattern of patterns) {
      const existing = byTool.get(pattern.tool) || [];
      existing.push(pattern);
      byTool.set(pattern.tool, existing);
    }

    // Format each tool section
    for (const [tool, toolPatterns] of byTool) {
      const hints = toolPatterns.map((p) => this.formatPatternHint(p));
      sections.push(`${tool}:\n${hints.join("\n")}`);
    }

    return `
<behavioral-hints>
The following hints are learned patterns from previous interactions. Use them to improve tool usage:

${sections.join("\n\n")}
</behavioral-hints>
`.trim();
  }

  /**
   * Format a single pattern as a hint
   */
  private formatPatternHint(pattern: BehavioralPattern): string {
    const confidence = Math.round(pattern.confidence * 100);
    const prefix = `- [${confidence}%]`;

    // Format based on pattern type
    switch (pattern.patternType) {
      case "input_method": {
        const data = pattern.pattern as InputMethodPattern;
        return `${prefix} ${pattern.description || `Use ${data.method} input method`}`;
      }

      case "selector": {
        const data = pattern.pattern as SelectorPattern;
        const alternatives = data.alternativeSelectors?.length
          ? ` (alternatives: ${data.alternativeSelectors.slice(0, 2).join(", ")})`
          : "";
        return `${prefix} Selector "${data.selector}" works${alternatives}`;
      }

      case "command": {
        const data = pattern.pattern as CommandPattern;
        const variations = data.variations?.length
          ? ` (variations: ${data.variations.slice(0, 2).join(", ")})`
          : "";
        return `${prefix} Command: ${truncate(data.command, 60)}${variations}`;
      }

      case "path": {
        const data = pattern.pattern as PathPattern;
        return `${prefix} Path: ${data.path} (${data.pathType})`;
      }

      case "timing": {
        const data = pattern.pattern as TimingPattern;
        return `${prefix} Wait ${data.optimalWaitMs}ms before "${data.operation}"`;
      }

      case "error_recovery": {
        const data = pattern.pattern as ErrorRecoveryPattern;
        return `${prefix} For error "${data.errorPattern}": ${data.recovery.action}`;
      }

      case "preference": {
        const data = pattern.pattern as PreferencePattern;
        return `${prefix} Prefer ${data.key}=${JSON.stringify(data.value)}`;
      }

      default:
        return `${prefix} ${pattern.description}`;
    }
  }

  /**
   * Get patterns for a specific tool context (for external use)
   */
  getPatternsForTool(params: {
    tool: string;
    action?: string;
    context: Partial<PatternContext>;
    personaId: string;
  }): BehavioralPattern[] {
    return this.store.getRelevantPatterns({
      tool: params.tool,
      action: params.action,
      context: params.context,
      personaId: params.personaId,
      limit: this.config.maxPatternsPerTool,
    });
  }

  /**
   * Format patterns as hints for a specific tool call
   *
   * This can be used to inject hints directly into tool parameters.
   */
  formatHintsForToolCall(patterns: BehavioralPattern[]): Record<string, unknown> | undefined {
    if (patterns.length === 0) {
      return undefined;
    }

    const hints: Record<string, unknown> = {};

    for (const pattern of patterns) {
      switch (pattern.patternType) {
        case "input_method": {
          const data = pattern.pattern as InputMethodPattern;
          hints.preferredInputMethod = data.method;
          if (data.fallbackMethod) {
            hints.fallbackInputMethod = data.fallbackMethod;
          }
          break;
        }

        case "selector": {
          const data = pattern.pattern as SelectorPattern;
          if (!hints.alternativeSelectors) {
            hints.alternativeSelectors = [];
          }
          (hints.alternativeSelectors as string[]).push(data.selector);
          if (data.alternativeSelectors) {
            (hints.alternativeSelectors as string[]).push(...data.alternativeSelectors);
          }
          break;
        }

        case "timing": {
          const data = pattern.pattern as TimingPattern;
          if (!hints.waitBeforeMs || data.optimalWaitMs > (hints.waitBeforeMs as number)) {
            hints.waitBeforeMs = data.optimalWaitMs;
          }
          break;
        }

        case "error_recovery": {
          const data = pattern.pattern as ErrorRecoveryPattern;
          if (!hints.errorRecoveries) {
            hints.errorRecoveries = [];
          }
          (hints.errorRecoveries as Array<{ pattern: string; action: string }>).push({
            pattern: data.errorPattern,
            action: data.recovery.action,
          });
          break;
        }
      }
    }

    return Object.keys(hints).length > 0 ? hints : undefined;
  }

  /**
   * Get injector stats
   */
  getStats() {
    return {
      enabled: this.config.enabled,
      targetTools: this.config.targetTools,
      maxPatternsPerTool: this.config.maxPatternsPerTool,
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + "...";
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create a context injector with default configuration
 */
export function createContextInjector(
  store: BehavioralStore,
  config?: Partial<ContextInjectorConfig>,
): ContextInjector {
  return new ContextInjector(store, config);
}
