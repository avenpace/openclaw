/**
 * Update Cycle
 *
 * Implements the Mem0-inspired extraction → update cycle:
 * 1. Extract patterns from observations
 * 2. Find similar existing patterns
 * 3. Decide: ADD, UPDATE, DELETE, or NOOP
 * 4. Execute the decision
 * 5. Check for promotion to global
 *
 * This is the core learning loop for behavioral memory.
 */

import { createSubsystemLogger } from "../logging/subsystem.js";
import { extractPattern } from "./extraction.js";
import type { BehavioralStore } from "./storage/store.js";
import type {
  ToolObservation,
  ExtractedPattern,
  BehavioralPattern,
  UpdateDecision,
  SimilarPattern,
  PatternData,
  InputMethodPattern,
  SelectorPattern,
  CommandPattern,
  PathPattern,
  TimingPattern,
  PreferencePattern,
} from "./types.js";

const log = createSubsystemLogger("behavioral/update-cycle");

/**
 * Configuration for the update cycle
 */
export interface UpdateCycleConfig {
  // Similarity thresholds
  similarityThreshold: number; // Below this = ADD new pattern
  exactMatchThreshold: number; // Above this = NOOP (same pattern)

  // Conflict detection
  conflictConfidenceThreshold: number; // Consider deletion if conflicting

  // Embedding function (optional)
  getEmbedding?: (text: string) => Promise<number[]>;
}

const DEFAULT_CONFIG: UpdateCycleConfig = {
  similarityThreshold: 0.75,
  exactMatchThreshold: 0.95,
  conflictConfidenceThreshold: 0.6,
};

/**
 * Process a tool observation through the update cycle
 *
 * This is the main entry point for learning from interactions.
 */
export async function processObservation(
  observation: ToolObservation,
  store: BehavioralStore,
  config: Partial<UpdateCycleConfig> = {},
): Promise<{
  decision: UpdateDecision;
  pattern: BehavioralPattern | null;
}> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  log.debug("Processing observation:", observation.tool, observation.action);

  // Step 1: Extract pattern from observation
  const extracted = extractPattern(observation);

  if (!extracted) {
    log.debug("No pattern extracted");
    return { decision: { action: "NOOP" }, pattern: null };
  }

  // Step 2: Find similar existing patterns
  const similar = await findSimilarPatterns(extracted, observation.personaId, store, cfg);

  // Step 3: Determine update action
  const decision = determineUpdateAction(extracted, similar, observation, cfg);

  log.debug("Update decision:", decision.action);

  // Step 4: Execute the decision
  const pattern = await executeDecision(decision, extracted, observation, store);

  // Step 5: Check for promotion to global
  if (pattern && observation.success && pattern.scope === "persona") {
    await checkAndPromote(pattern, store);
  }

  return { decision, pattern };
}

/**
 * Find similar existing patterns
 */
async function findSimilarPatterns(
  extracted: ExtractedPattern,
  personaId: string,
  store: BehavioralStore,
  config: UpdateCycleConfig,
): Promise<SimilarPattern[]> {
  // First, try exact context hash match
  const exactMatches = store.queryPatterns({
    tool: extracted.tool,
    action: extracted.action,
    context: {},
    personaId,
    includeGlobal: true,
    limit: 10,
  });

  // Filter to same context hash and pattern type
  const contextMatches = exactMatches.patterns.filter(
    (p) => p.contextHash === extracted.contextHash && p.patternType === extracted.patternType,
  );

  if (contextMatches.length > 0) {
    // Calculate similarity based on pattern data
    return contextMatches.map((p) => ({
      pattern: p,
      similarity: calculatePatternSimilarity(extracted.pattern, p.pattern),
    }));
  }

  // If embedding function available, try vector search
  if (config.getEmbedding && extracted.embedding) {
    return store.findSimilar(extracted.embedding, {
      personaId,
      includeGlobal: true,
      threshold: config.similarityThreshold,
      limit: 5,
    });
  }

  return [];
}

/**
 * Determine what action to take based on extracted pattern and similar patterns
 */
function determineUpdateAction(
  extracted: ExtractedPattern,
  similar: SimilarPattern[],
  observation: ToolObservation,
  config: UpdateCycleConfig,
): UpdateDecision {
  // No similar patterns = ADD
  if (similar.length === 0) {
    return { action: "ADD" };
  }

  // Find best match
  const bestMatch = similar.reduce((best, current) =>
    current.similarity > best.similarity ? current : best,
  );

  // Exact match = NOOP (just update confidence)
  if (bestMatch.similarity >= config.exactMatchThreshold) {
    return { action: "NOOP", targetId: bestMatch.pattern.id };
  }

  // High similarity = UPDATE
  if (bestMatch.similarity >= config.similarityThreshold) {
    // Check if this is a conflicting pattern
    if (isConflictingPattern(extracted, bestMatch.pattern, observation)) {
      // If observation succeeded and existing pattern has low confidence, replace
      if (
        observation.success &&
        bestMatch.pattern.confidence < config.conflictConfidenceThreshold
      ) {
        return {
          action: "UPDATE",
          targetId: bestMatch.pattern.id,
          mergeStrategy: "replace",
        };
      }

      // If observation failed and existing pattern has high confidence, keep existing
      if (!observation.success && bestMatch.pattern.confidence > 0.7) {
        return { action: "NOOP", targetId: bestMatch.pattern.id };
      }
    }

    return {
      action: "UPDATE",
      targetId: bestMatch.pattern.id,
      mergeStrategy: "merge",
    };
  }

  // Low similarity = ADD (different enough to be new pattern)
  return { action: "ADD" };
}

/**
 * Execute the update decision
 */
async function executeDecision(
  decision: UpdateDecision,
  extracted: ExtractedPattern,
  observation: ToolObservation,
  store: BehavioralStore,
): Promise<BehavioralPattern | null> {
  switch (decision.action) {
    case "ADD":
      return store.addPattern(extracted, observation.personaId);

    case "UPDATE": {
      const updates: Partial<Pick<BehavioralPattern, "pattern" | "description">> = {};

      if (decision.mergeStrategy === "replace") {
        updates.pattern = extracted.pattern;
        updates.description = extracted.description;
      } else {
        // Merge strategy - combine patterns if possible
        const existing = store.getPattern(decision.targetId);
        if (existing) {
          updates.pattern = mergePatternData(existing.pattern, extracted.pattern);
        }
      }

      return store.updatePattern(decision.targetId, updates, observation.success);
    }

    case "DELETE":
      store.deletePattern(decision.targetId, decision.reason);
      return null;

    case "NOOP":
      if (decision.targetId) {
        store.updateConfidence(decision.targetId, observation.success);
        return store.getPattern(decision.targetId);
      }
      return null;
  }
}

/**
 * Check if pattern should be promoted to global
 */
async function checkAndPromote(pattern: BehavioralPattern, store: BehavioralStore): Promise<void> {
  if (pattern.scope !== "persona" || !pattern.personaId) {
    return;
  }

  // Check if this pattern meets promotion criteria
  const shouldPromote = await store.checkPromotion(
    pattern.contextHash,
    pattern.patternType,
    pattern.pattern,
    pattern.personaId,
  );

  if (shouldPromote) {
    log.info("Promoting pattern to global:", pattern.id);
    store.promoteToGlobal(pattern);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate similarity between two pattern data objects
 */
function calculatePatternSimilarity(a: PatternData, b: PatternData): number {
  // Different types = 0 similarity
  if (a.type !== b.type) {
    return 0;
  }

  // Type-specific similarity
  switch (a.type) {
    case "input_method": {
      const inputA = a;
      const inputB = b as InputMethodPattern;
      return inputA.method === inputB.method ? 1.0 : 0.3;
    }

    case "selector": {
      const selA = a;
      const selB = b as SelectorPattern;
      return calculateStringSimilarity(selA.selector, selB.selector);
    }

    case "command": {
      const cmdA = a;
      const cmdB = b as CommandPattern;
      return calculateStringSimilarity(cmdA.command, cmdB.command);
    }

    case "path": {
      const pathA = a;
      const pathB = b as PathPattern;
      return calculateStringSimilarity(pathA.path, pathB.path);
    }

    case "timing": {
      const timingA = a;
      const timingB = b as TimingPattern;
      const diff = Math.abs(timingA.optimalWaitMs - timingB.optimalWaitMs);
      return Math.max(0, 1 - diff / Math.max(timingA.optimalWaitMs, timingB.optimalWaitMs));
    }

    case "preference": {
      const prefA = a;
      const prefB = b as PreferencePattern;
      return prefA.value === prefB.value ? 1.0 : 0.5;
    }

    default:
      // Generic JSON comparison
      return JSON.stringify(a) === JSON.stringify(b) ? 1.0 : 0.5;
  }
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(a: string, b: string): number {
  if (a === b) {
    return 1.0;
  }
  if (!a || !b) {
    return 0.0;
  }

  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Check if two patterns are conflicting
 */
function isConflictingPattern(
  extracted: ExtractedPattern,
  existing: BehavioralPattern,
  _observation: ToolObservation,
): boolean {
  // Same context but different pattern = conflict
  if (extracted.contextHash === existing.contextHash) {
    if (extracted.patternType === existing.patternType) {
      // Same type, check if values differ
      const similarity = calculatePatternSimilarity(extracted.pattern, existing.pattern);
      return similarity < 0.9; // Different enough to be conflict
    }
  }

  return false;
}

/**
 * Merge two pattern data objects
 */
function mergePatternData(existing: PatternData, incoming: PatternData): PatternData {
  // Type must match
  if (existing.type !== incoming.type) {
    return incoming; // Can't merge, use incoming
  }

  switch (existing.type) {
    case "selector": {
      const existingSelector = existing;
      const incomingSelector = incoming as SelectorPattern;

      // Add incoming as alternative if different
      const alternatives = new Set(existingSelector.alternativeSelectors || []);
      if (existingSelector.selector !== incomingSelector.selector) {
        alternatives.add(incomingSelector.selector);
      }

      return {
        ...existingSelector,
        alternativeSelectors: Array.from(alternatives).slice(0, 5), // Keep max 5
      };
    }

    case "command": {
      const existingCmd = existing;
      const incomingCmd = incoming as CommandPattern;

      // Add as variation
      const variations = new Set(existingCmd.variations || []);
      if (existingCmd.command !== incomingCmd.command) {
        variations.add(incomingCmd.command);
      }

      return {
        ...existingCmd,
        variations: Array.from(variations).slice(0, 5),
      };
    }

    case "timing": {
      const existingTiming = existing;
      const incomingTiming = incoming as TimingPattern;

      // Average the timings
      return {
        ...existingTiming,
        optimalWaitMs: Math.round(
          (existingTiming.optimalWaitMs + incomingTiming.optimalWaitMs) / 2,
        ),
        minWaitMs: Math.min(
          existingTiming.minWaitMs || existingTiming.optimalWaitMs,
          incomingTiming.optimalWaitMs,
        ),
        maxWaitMs: Math.max(
          existingTiming.maxWaitMs || existingTiming.optimalWaitMs,
          incomingTiming.optimalWaitMs,
        ),
      };
    }

    default:
      // For other types, prefer incoming (newer)
      return incoming;
  }
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Process multiple observations in batch
 */
export async function processBatch(
  observations: ToolObservation[],
  store: BehavioralStore,
  config: Partial<UpdateCycleConfig> = {},
): Promise<{
  processed: number;
  added: number;
  updated: number;
  unchanged: number;
}> {
  let added = 0;
  let updated = 0;
  let unchanged = 0;

  for (const observation of observations) {
    const result = await processObservation(observation, store, config);

    switch (result.decision.action) {
      case "ADD":
        added++;
        break;
      case "UPDATE":
        updated++;
        break;
      default:
        unchanged++;
    }
  }

  return {
    processed: observations.length,
    added,
    updated,
    unchanged,
  };
}
