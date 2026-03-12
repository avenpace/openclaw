/**
 * Pattern Extraction
 *
 * Extracts actionable patterns from tool observations.
 * This is the "Extraction Phase" inspired by Mem0's architecture.
 */

import crypto from "node:crypto";
import { createSubsystemLogger } from "../logging/subsystem.js";
import type {
  ToolObservation,
  ExtractedPattern,
  PatternContext,
  InputMethodPattern,
  SelectorPattern,
  CommandPattern,
  PathPattern,
  ErrorRecoveryPattern,
  TimingPattern,
  PreferencePattern,
} from "./types.js";

const log = createSubsystemLogger("behavioral/extraction");

/**
 * Extract patterns from a tool observation
 * Returns null if no actionable pattern can be extracted
 */
export function extractPattern(observation: ToolObservation): ExtractedPattern | null {
  const extractor = TOOL_EXTRACTORS[observation.tool];

  if (!extractor) {
    log.debug("No extractor for tool:", observation.tool);
    return null;
  }

  try {
    const pattern = extractor(observation);
    if (pattern) {
      log.debug("Extracted pattern:", pattern.patternType, pattern.description);
    }
    return pattern;
  } catch (err) {
    log.warn("Pattern extraction failed:", err);
    return null;
  }
}

/**
 * Generate a hash for context (for fast lookups)
 */
export function hashContext(context: PatternContext): string {
  // Include only relevant fields in hash
  const normalized = {
    domain: context.domain,
    os: context.os,
    channel: context.channel,
    skillId: context.skillId,
    taskType: context.taskType,
  };

  return crypto
    .createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex")
    .substring(0, 16);
}

// =============================================================================
// TOOL-SPECIFIC EXTRACTORS
// =============================================================================

type PatternExtractor = (observation: ToolObservation) => ExtractedPattern | null;

const TOOL_EXTRACTORS: Record<string, PatternExtractor> = {
  browser: extractBrowserPattern,
  device: extractDevicePattern,
  devices_run: extractDevicePattern, // Alias
  message: extractMessagePattern,
  messaging: extractMessagePattern, // Alias
};

// -----------------------------------------------------------------------------
// Browser Tool Extractor
// -----------------------------------------------------------------------------

function extractBrowserPattern(observation: ToolObservation): ExtractedPattern | null {
  const action = observation.action || (observation.params as { action?: string }).action;
  const params = observation.params;

  // Extract domain from URL
  const url = params.url as string | undefined;
  const domain = url ? extractDomain(url) : undefined;

  const context: PatternContext = {
    domain,
    pageType: inferPageType(url),
  };

  const contextHash = hashContext(context);

  // Input method learning (CDP vs content-script)
  if (action === "act" || action === "type" || action === "click") {
    const inputMethod = params.inputMethod as string | undefined;

    if (inputMethod && observation.success) {
      const pattern: InputMethodPattern = {
        type: "input_method",
        method: inputMethod as "cdp" | "content-script" | "a11y",
      };

      return {
        tool: "browser",
        action,
        context,
        contextHash,
        patternType: "input_method",
        pattern,
        description: `${domain}: Use ${inputMethod} for ${action} actions`,
      };
    }
  }

  // Selector learning
  if (action === "click" || action === "type") {
    const selector = params.selector as string | undefined;
    const _ref = params.ref as string | undefined; // Reserved for future use
    const elementType = params.elementType as string | undefined;

    if (selector && observation.success) {
      context.elementType = elementType;

      const pattern: SelectorPattern = {
        type: "selector",
        selector,
        selectorType: inferSelectorType(selector),
      };

      return {
        tool: "browser",
        action,
        context,
        contextHash: hashContext(context),
        patternType: "selector",
        pattern,
        description: `${domain}: Selector "${selector}" works for ${elementType || action}`,
      };
    }
  }

  // Timing learning (from retries)
  if (observation.retryCount && observation.retryCount > 0 && observation.success) {
    const pattern: TimingPattern = {
      type: "timing",
      operation: action || "unknown",
      optimalWaitMs: Math.min(2000, observation.retryCount * 500),
      minWaitMs: 500,
      maxWaitMs: 5000,
    };

    return {
      tool: "browser",
      action,
      context,
      contextHash,
      patternType: "timing",
      pattern,
      description: `${domain}: Wait ${pattern.optimalWaitMs}ms before ${action}`,
    };
  }

  // Error recovery learning
  if (!observation.success && observation.error) {
    const errorRecovery = extractErrorRecovery(observation);
    if (errorRecovery) {
      return {
        tool: "browser",
        action,
        context: {
          ...context,
          errorType: observation.error.type,
        },
        contextHash: hashContext({
          ...context,
          errorType: observation.error.type,
        }),
        patternType: "error_recovery",
        pattern: errorRecovery,
        description: `${domain}: Recovery for "${observation.error.type}"`,
      };
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Device Tool Extractor
// -----------------------------------------------------------------------------

function extractDevicePattern(observation: ToolObservation): ExtractedPattern | null {
  const params = observation.params;
  const command = params.command as string | undefined;

  // Detect OS from command patterns or explicit param
  const os = (params.os as string) || inferOsFromCommand(command);

  const context: PatternContext = {
    os,
  };

  const contextHash = hashContext(context);

  // Command pattern learning
  if (command && observation.success) {
    const intent = inferCommandIntent(command);

    if (intent) {
      context.taskType = intent;

      const pattern: CommandPattern = {
        type: "command",
        command,
        shell: command.includes("|") || command.includes("&&") || command.includes("$"),
      };

      return {
        tool: "device",
        action: "run_command",
        context,
        contextHash: hashContext(context),
        patternType: "command",
        pattern,
        description: `${os}: Command for "${intent}": ${truncate(command, 50)}`,
      };
    }
  }

  // Path pattern learning
  const path = extractPathFromCommand(command);
  if (path && observation.success) {
    const pathType = inferPathType(path);

    const pattern: PathPattern = {
      type: "path",
      path,
      pathType,
    };

    return {
      tool: "device",
      action: "path",
      context,
      contextHash,
      patternType: "path",
      pattern,
      description: `${os}: ${pathType} path: ${path}`,
    };
  }

  return null;
}

// -----------------------------------------------------------------------------
// Message Tool Extractor
// -----------------------------------------------------------------------------

function extractMessagePattern(observation: ToolObservation): ExtractedPattern | null {
  const params = observation.params;
  const channel = params.channel as string | undefined;

  if (!channel) {
    return null;
  }

  const context: PatternContext = {
    channel,
  };

  const contextHash = hashContext(context);

  // Formatting preference learning
  if (observation.success) {
    const message = params.message as string | undefined;

    if (message) {
      const format = inferMessageFormat(message);

      const pattern: PreferencePattern = {
        type: "preference",
        key: "message_format",
        value: format,
      };

      return {
        tool: "message",
        action: "send",
        context,
        contextHash,
        patternType: "preference",
        pattern,
        description: `${channel}: Prefer ${format} message format`,
      };
    }
  }

  return null;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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

function inferPageType(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

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

function inferSelectorType(selector: string): SelectorPattern["selectorType"] {
  if (selector.startsWith("//") || selector.startsWith("(//")) {
    return "xpath";
  }
  if (selector.startsWith("[aria-")) {
    return "aria";
  }
  if (selector.startsWith("text=") || selector.startsWith('"')) {
    return "text";
  }
  if (selector.startsWith("e") && /^e\d+$/.test(selector)) {
    return "ref";
  }
  return "css";
}

function inferOsFromCommand(command: string | undefined): string {
  if (!command) {
    return "unknown";
  }

  if (command.includes("osascript") || command.includes("/Applications/")) {
    return "macos";
  }
  if (command.includes("powershell") || command.includes("cmd.exe") || command.includes("\\")) {
    return "windows";
  }
  if (command.includes("/usr/") || command.includes("apt") || command.includes("systemctl")) {
    return "linux";
  }

  return "unix"; // Generic Unix-like
}

function inferCommandIntent(command: string): string | undefined {
  const lower = command.toLowerCase();

  if (lower.includes("open ") || lower.includes("start ")) {
    return "open_app";
  }
  if (lower.includes("ls ") || lower.includes("dir ") || lower.includes("find ")) {
    return "list_files";
  }
  if (lower.includes("cat ") || lower.includes("type ") || lower.includes("less ")) {
    return "read_file";
  }
  if (lower.includes("mkdir ") || lower.includes("touch ")) {
    return "create";
  }
  if (lower.includes("rm ") || lower.includes("del ")) {
    return "delete";
  }
  if (lower.includes("cp ") || lower.includes("copy ") || lower.includes("mv ")) {
    return "move_copy";
  }
  if (lower.includes("curl ") || lower.includes("wget ")) {
    return "download";
  }

  return undefined;
}

function extractPathFromCommand(command: string | undefined): string | undefined {
  if (!command) {
    return undefined;
  }

  // Match common path patterns
  const patterns = [
    /~\/[^\s"']+/, // ~/path
    /\/[\w-]+(?:\/[\w.-]+)+/, // /absolute/path
    /[A-Z]:\\[\w\\.-]+/, // C:\Windows\path
    /\$HOME\/[^\s"']+/, // $HOME/path
  ];

  for (const pattern of patterns) {
    const match = command.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return undefined;
}

function inferPathType(path: string): "file" | "directory" {
  // If ends with / or has no extension, likely directory
  if (path.endsWith("/") || path.endsWith("\\")) {
    return "directory";
  }

  const lastPart = path.split(/[/\\]/).pop() || "";
  if (lastPart.includes(".")) {
    return "file";
  }

  return "directory";
}

function inferMessageFormat(message: string): string {
  if (message.includes("**") || message.includes("```") || message.includes("##")) {
    return "markdown";
  }
  if (message.length < 100 && !message.includes("\n")) {
    return "minimal";
  }
  if (message.length > 500 || message.split("\n").length > 5) {
    return "detailed";
  }
  return "plain";
}

function extractErrorRecovery(observation: ToolObservation): ErrorRecoveryPattern | null {
  const error = observation.error;
  if (!error) {
    return null;
  }

  // Known error patterns and recoveries
  const knownRecoveries: Array<{
    pattern: RegExp;
    recovery: ErrorRecoveryPattern["recovery"];
  }> = [
    {
      pattern: /element not found|no such element/i,
      recovery: { action: "wait_and_retry", params: { waitMs: 2000 } },
    },
    {
      pattern: /not clickable|obscured/i,
      recovery: { action: "scroll_into_view", params: {} },
    },
    {
      pattern: /timeout/i,
      recovery: { action: "increase_timeout", params: { factor: 2 } },
    },
    {
      pattern: /stale element/i,
      recovery: { action: "refetch_element", params: {} },
    },
  ];

  for (const { pattern, recovery } of knownRecoveries) {
    if (pattern.test(error.message)) {
      return {
        type: "error_recovery",
        errorPattern: pattern.source,
        recovery,
      };
    }
  }

  return null;
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + "...";
}

// =============================================================================
// SKILL EXTRACTOR REGISTRY
// =============================================================================

/**
 * Register a custom pattern extractor for a skill
 */
const skillExtractors = new Map<string, PatternExtractor>();

export function registerSkillExtractor(skillId: string, extractor: PatternExtractor): void {
  skillExtractors.set(skillId, extractor);
  TOOL_EXTRACTORS[`skill:${skillId}`] = extractor;
}

export function getSkillExtractor(skillId: string): PatternExtractor | undefined {
  return skillExtractors.get(skillId);
}
