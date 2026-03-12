/**
 * Behavioral Learning System - Type Definitions
 *
 * This module defines types for the agentic learning system that enables
 * agents to learn from all interactions and improve over time.
 *
 * Inspired by Mem0's extraction/update cycle architecture.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * A single learned behavioral pattern
 */
export interface BehavioralPattern {
  id: string;

  // Scope
  personaId: string | null; // null = global pattern
  scope: "persona" | "global";

  // Tool context
  tool: string; // "browser", "device", "message", "skill:{id}"
  action?: string; // "click", "type", "run_command", etc.

  // Pattern classification
  patternType: PatternType;

  // Context that triggers this pattern
  context: PatternContext;
  contextHash: string; // For fast lookups

  // The learned pattern data
  pattern: PatternData;
  description: string; // Human-readable description

  // Confidence metrics
  confidence: number; // 0.0 - 1.0
  successCount: number;
  failureCount: number;

  // Timestamps
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PatternType =
  | "input_method" // Browser: CDP vs content-script
  | "selector" // Browser: element selectors that work
  | "flow" // Multi-step action sequences
  | "command" // Device: command patterns
  | "path" // Device: file/directory paths
  | "preference" // User preferences
  | "error_recovery" // What fixes worked for errors
  | "timing" // Optimal wait times, retry intervals
  | "formatting" // Message formatting preferences
  | "parameter"; // Optimal tool parameters

/**
 * Context that defines when a pattern applies
 */
export interface PatternContext {
  // Browser context
  domain?: string; // "tiktok.com"
  pageType?: string; // "login", "feed", "profile"
  elementType?: string; // "button", "input", "link"

  // Device context
  os?: string; // "macos", "windows", "linux"
  app?: string; // Application name

  // Message context
  channel?: string; // "whatsapp", "telegram"

  // Skill context
  skillId?: string;

  // Task context
  taskType?: string; // "login", "search", "post"
  intent?: string; // What the user is trying to do

  // Error context (for error_recovery patterns)
  errorType?: string;
  errorMessage?: string;
}

/**
 * The actual pattern data (varies by patternType)
 */
export type PatternData =
  | InputMethodPattern
  | SelectorPattern
  | FlowPattern
  | CommandPattern
  | PathPattern
  | PreferencePattern
  | ErrorRecoveryPattern
  | TimingPattern
  | FormattingPattern
  | ParameterPattern;

export interface InputMethodPattern {
  type: "input_method";
  method: "cdp" | "content-script" | "a11y";
  fallbackMethod?: "cdp" | "content-script" | "a11y";
}

export interface SelectorPattern {
  type: "selector";
  selector: string;
  selectorType: "css" | "xpath" | "aria" | "text" | "ref";
  alternativeSelectors?: string[];
}

export interface FlowPattern {
  type: "flow";
  steps: Array<{
    action: string;
    target?: string;
    value?: string;
    waitAfter?: number;
  }>;
}

export interface CommandPattern {
  type: "command";
  command: string;
  shell?: boolean;
  variations?: string[];
}

export interface PathPattern {
  type: "path";
  path: string;
  pathType: "file" | "directory";
  expandsTo?: string; // Resolved path
}

export interface PreferencePattern {
  type: "preference";
  key: string;
  value: unknown;
}

export interface ErrorRecoveryPattern {
  type: "error_recovery";
  errorPattern: string; // Regex or exact match
  recovery: {
    action: string;
    params?: Record<string, unknown>;
  };
}

export interface TimingPattern {
  type: "timing";
  operation: string;
  optimalWaitMs: number;
  minWaitMs?: number;
  maxWaitMs?: number;
}

export interface FormattingPattern {
  type: "formatting";
  format: "plain" | "markdown" | "minimal" | "detailed";
  maxLength?: number;
  includeEmoji?: boolean;
}

export interface ParameterPattern {
  type: "parameter";
  paramName: string;
  optimalValue: unknown;
  valueRange?: { min?: number; max?: number };
}

// =============================================================================
// OBSERVATION TYPES
// =============================================================================

/**
 * Raw observation from a tool execution
 */
export interface ToolObservation {
  id: string;
  personaId: string;
  timestamp: Date;

  // Tool info
  tool: string;
  action?: string;
  params: Record<string, unknown>;

  // Context
  context: PatternContext;

  // Result
  success: boolean;
  result?: unknown;
  error?: {
    type: string;
    message: string;
    stack?: string;
  };

  // Metrics
  durationMs: number;
  retryCount?: number;

  // What hints were used (if any)
  hintsUsed?: string[]; // Pattern IDs
}

/**
 * Extracted pattern from an observation (before storage decision)
 */
export interface ExtractedPattern {
  tool: string;
  action?: string;
  context: PatternContext;
  contextHash: string;
  patternType: PatternType;
  pattern: PatternData;
  description: string;
  embedding?: number[]; // Vector embedding for similarity search
}

// =============================================================================
// UPDATE CYCLE TYPES
// =============================================================================

export type UpdateDecision =
  | { action: "ADD" }
  | { action: "UPDATE"; targetId: string; mergeStrategy: "replace" | "merge" }
  | { action: "DELETE"; targetId: string; reason: string }
  | { action: "NOOP"; targetId?: string }; // Just update confidence

/**
 * Result of pattern similarity search
 */
export interface SimilarPattern {
  pattern: BehavioralPattern;
  similarity: number; // 0.0 - 1.0
}

// =============================================================================
// STORAGE TYPES
// =============================================================================

export interface BehavioralStoreConfig {
  // Database path
  dbPath: string;

  // Embedding config (reuse OpenClaw's)
  embeddingProvider?: string;
  embeddingModel?: string;
  embeddingDims?: number;

  // Confidence thresholds
  minConfidenceForUse: number; // Don't use patterns below this
  minConfidenceForGlobal: number; // Don't promote to global below this
  confidenceDecayRate: number; // How fast old patterns lose confidence

  // Limits
  maxPatternsPerPersona: number;
  maxGlobalPatterns: number;

  // Promotion settings
  minSuccessForPromotion: number; // Successes needed for global promotion
  minPersonasForPromotion: number; // Different personas with same pattern
}

export const DEFAULT_BEHAVIORAL_CONFIG: Omit<BehavioralStoreConfig, "dbPath"> = {
  embeddingDims: 1536, // OpenAI text-embedding-3-small
  minConfidenceForUse: 0.3,
  minConfidenceForGlobal: 0.8,
  confidenceDecayRate: 0.01, // Per day
  maxPatternsPerPersona: 10000,
  maxGlobalPatterns: 50000,
  minSuccessForPromotion: 10,
  minPersonasForPromotion: 3,
};

// =============================================================================
// QUERY TYPES
// =============================================================================

export interface PatternQuery {
  tool: string;
  action?: string;
  context: Partial<PatternContext>;
  personaId?: string;
  includeGlobal?: boolean;
  minConfidence?: number;
  limit?: number;
}

export interface PatternQueryResult {
  patterns: BehavioralPattern[];
  queryTimeMs: number;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

export type BehavioralEvent =
  | { type: "pattern_added"; pattern: BehavioralPattern }
  | { type: "pattern_updated"; pattern: BehavioralPattern; changes: string[] }
  | { type: "pattern_deleted"; patternId: string; reason: string }
  | { type: "pattern_promoted"; pattern: BehavioralPattern }
  | { type: "confidence_updated"; patternId: string; oldConfidence: number; newConfidence: number };

export type BehavioralEventHandler = (event: BehavioralEvent) => void | Promise<void>;
