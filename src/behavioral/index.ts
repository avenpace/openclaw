/**
 * Behavioral Learning System
 *
 * A Mem0-inspired learning system for agentic tool interactions.
 * Enables agents to learn from all interactions and improve over time.
 *
 * Architecture:
 * 1. Observer → Watches tool executions via after_tool_call hook
 * 2. Extraction → Extracts actionable patterns from observations
 * 3. Update Cycle → Decides ADD/UPDATE/DELETE/NOOP for each pattern
 * 4. Storage → SQLite + optional vector embeddings for similarity search
 * 5. Context Injection → Injects relevant hints via before_prompt_build hook
 *
 * Scopes:
 * - Per-persona: Patterns specific to a persona's behavior
 * - Global: Patterns promoted from multiple personas (platform-wide learnings)
 *
 * @module behavioral
 */

// Re-export types
export type {
  // Core types
  BehavioralPattern,
  PatternType,
  PatternContext,
  PatternData,

  // Pattern data types
  InputMethodPattern,
  SelectorPattern,
  FlowPattern,
  CommandPattern,
  PathPattern,
  PreferencePattern,
  ErrorRecoveryPattern,
  TimingPattern,
  FormattingPattern,
  ParameterPattern,

  // Observation types
  ToolObservation,
  ExtractedPattern,

  // Update cycle types
  UpdateDecision,
  SimilarPattern,

  // Storage types
  BehavioralStoreConfig,
  PatternQuery,
  PatternQueryResult,

  // Event types
  BehavioralEvent,
  BehavioralEventHandler,
} from "./types.js";

export { DEFAULT_BEHAVIORAL_CONFIG } from "./types.js";

// Storage
export { BehavioralStore } from "./storage/store.js";
export {
  initBehavioralSchema,
  initBehavioralVectorTable,
  cleanupOldObservations,
  decayPatternConfidence,
  getBehavioralStats,
} from "./storage/schema.js";

// Extraction
export {
  extractPattern,
  hashContext,
  registerSkillExtractor,
  getSkillExtractor,
} from "./extraction.js";

// Update cycle
export { processObservation, processBatch, type UpdateCycleConfig } from "./update-cycle.js";

// Observer
export {
  BehavioralObserver,
  createBehavioralObserver,
  type BehavioralObserverConfig,
} from "./observer.js";

// Context injection
export {
  ContextInjector,
  createContextInjector,
  type ContextInjectorConfig,
} from "./context-injector.js";

// =============================================================================
// CONVENIENCE FACTORY
// =============================================================================

import { join } from "node:path";
import { ContextInjector, type ContextInjectorConfig } from "./context-injector.js";
import { BehavioralObserver, type BehavioralObserverConfig } from "./observer.js";
import { BehavioralStore } from "./storage/store.js";
import type { BehavioralStoreConfig } from "./types.js";

/**
 * Configuration for the complete behavioral learning system
 */
export interface BehavioralSystemConfig {
  /** Directory to store the behavioral database */
  stateDir: string;

  /** Store configuration overrides */
  storeConfig?: Partial<BehavioralStoreConfig>;

  /** Observer configuration overrides */
  observerConfig?: Partial<BehavioralObserverConfig>;

  /** Context injector configuration overrides */
  injectorConfig?: Partial<ContextInjectorConfig>;
}

/**
 * Complete behavioral learning system
 */
export interface BehavioralSystem {
  store: BehavioralStore;
  observer: BehavioralObserver;
  injector: ContextInjector;

  /** Cleanup and close the system */
  close: () => void;
}

/**
 * Create a complete behavioral learning system
 *
 * This is the main entry point for using the behavioral learning system.
 *
 * @example
 * ```typescript
 * import { createBehavioralSystem } from './behavioral/index.js';
 *
 * const system = createBehavioralSystem({
 *   stateDir: '/path/to/.openclaw-platform',
 * });
 *
 * // Register hooks with plugin registry
 * registry.registerHook({
 *   pluginId: 'behavioral-learning',
 *   hookName: 'after_tool_call',
 *   handler: system.observer.createAfterToolCallHandler(),
 * });
 *
 * registry.registerHook({
 *   pluginId: 'behavioral-learning',
 *   hookName: 'before_prompt_build',
 *   handler: system.injector.createBeforePromptBuildHandler(),
 * });
 *
 * // Later, clean up
 * system.close();
 * ```
 */
export function createBehavioralSystem(config: BehavioralSystemConfig): BehavioralSystem {
  const dbPath = join(config.stateDir, "behavioral.db");

  // Create store
  const store = new BehavioralStore({
    dbPath,
    ...config.storeConfig,
  });

  // Create observer
  const observer = new BehavioralObserver(store, config.observerConfig);

  // Create context injector
  const injector = new ContextInjector(store, config.injectorConfig);

  return {
    store,
    observer,
    injector,
    close: () => {
      store.close();
    },
  };
}

/**
 * Default state directory (same as OpenClaw platform state)
 */
export function getDefaultBehavioralStateDir(): string {
  return process.env.OPENCLAW_STATE_DIR || join(process.cwd(), ".openclaw-platform");
}
