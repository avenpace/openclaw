/**
 * Behavioral Pattern Store
 *
 * Main storage interface for behavioral patterns.
 * Handles CRUD, similarity search, and promotion.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { createSubsystemLogger } from "../../logging/subsystem.js";
import { loadSqliteVecExtension } from "../../memory/sqlite-vec.js";
import { requireNodeSqlite } from "../../memory/sqlite.js";
import type {
  BehavioralPattern,
  BehavioralStoreConfig,
  ExtractedPattern,
  PatternContext,
  PatternData,
  PatternQuery,
  PatternQueryResult,
  SimilarPattern,
  BehavioralEvent,
  BehavioralEventHandler,
} from "../types.js";
import { DEFAULT_BEHAVIORAL_CONFIG } from "../types.js";
import {
  initBehavioralSchema,
  initBehavioralVectorTable,
  cleanupOldObservations,
  decayPatternConfidence,
  getBehavioralStats,
} from "./schema.js";

const log = createSubsystemLogger("behavioral/store");

/**
 * Behavioral Pattern Store
 *
 * Manages storage and retrieval of behavioral patterns.
 * Supports both per-persona and global patterns.
 */
export class BehavioralStore {
  private db: DatabaseSync;
  private config: BehavioralStoreConfig;
  private vectorEnabled: boolean = false;
  private eventHandlers: Set<BehavioralEventHandler> = new Set();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<BehavioralStoreConfig> & { dbPath: string }) {
    this.config = { ...DEFAULT_BEHAVIORAL_CONFIG, ...config };

    // Ensure directory exists
    const dir = path.dirname(this.config.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Initialize SQLite
    const sqlite = requireNodeSqlite();
    this.db = new sqlite.DatabaseSync(this.config.dbPath);

    // Initialize schema
    initBehavioralSchema(this.db);

    // Try to load vector extension
    this.initVectorSupport();

    // Start periodic cleanup
    this.startCleanupTimer();

    log.info("BehavioralStore initialized at", this.config.dbPath);
  }

  private initVectorSupport(): void {
    try {
      const extensionPath = loadSqliteVecExtension(this.db);
      if (extensionPath) {
        this.vectorEnabled = initBehavioralVectorTable(this.db, this.config.embeddingDims);
        if (this.vectorEnabled) {
          log.info("Vector similarity search enabled");
        }
      }
    } catch (err) {
      log.warn("Vector support not available:", err);
    }
  }

  private startCleanupTimer(): void {
    // Run cleanup every hour
    this.cleanupTimer = setInterval(
      () => {
        this.runMaintenance();
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Run maintenance tasks (cleanup, decay)
   */
  runMaintenance(): void {
    cleanupOldObservations(this.db);
    decayPatternConfidence(this.db, this.config.confidenceDecayRate);
  }

  /**
   * Close the store
   */
  close(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.db.close();
    log.info("BehavioralStore closed");
  }

  // ===========================================================================
  // EVENT HANDLING
  // ===========================================================================

  /**
   * Subscribe to behavioral events
   */
  onEvent(handler: BehavioralEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  private emitEvent(event: BehavioralEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        void handler(event);
      } catch (err) {
        log.warn("Event handler error:", err);
      }
    }
  }

  // ===========================================================================
  // PATTERN CRUD
  // ===========================================================================

  /**
   * Add a new pattern
   */
  addPattern(extracted: ExtractedPattern, personaId: string | null): BehavioralPattern {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const pattern: BehavioralPattern = {
      id,
      personaId,
      scope: personaId ? "persona" : "global",
      tool: extracted.tool,
      action: extracted.action,
      patternType: extracted.patternType,
      context: extracted.context,
      contextHash: extracted.contextHash,
      pattern: extracted.pattern,
      description: extracted.description,
      confidence: 0.5, // Start at neutral
      successCount: 1,
      failureCount: 0,
      lastUsedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.db
      .prepare(`
      INSERT INTO behavioral_patterns (
        id, persona_id, scope, tool, action, pattern_type,
        context, context_hash, pattern, description,
        confidence, success_count, failure_count,
        last_used_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .run(
        pattern.id,
        pattern.personaId,
        pattern.scope,
        pattern.tool,
        pattern.action || null,
        pattern.patternType,
        JSON.stringify(pattern.context),
        pattern.contextHash,
        JSON.stringify(pattern.pattern),
        pattern.description,
        pattern.confidence,
        pattern.successCount,
        pattern.failureCount,
        now,
        now,
        now,
      );

    // Add embedding if available
    if (this.vectorEnabled && extracted.embedding) {
      this.addPatternEmbedding(pattern.id, extracted.embedding);
    }

    this.emitEvent({ type: "pattern_added", pattern });
    log.debug("Added pattern:", pattern.id, pattern.description);

    return pattern;
  }

  /**
   * Update an existing pattern
   */
  updatePattern(
    patternId: string,
    updates: Partial<Pick<BehavioralPattern, "pattern" | "description" | "confidence">>,
    success: boolean,
  ): BehavioralPattern | null {
    const existing = this.getPattern(patternId);
    if (!existing) {
      return null;
    }

    const changes: string[] = [];

    // Update confidence based on success/failure
    let newConfidence = existing.confidence;
    if (success) {
      // Increase confidence (diminishing returns)
      newConfidence = Math.min(1.0, existing.confidence + 0.1 * (1 - existing.confidence));
      changes.push("confidence_increased");
    } else {
      // Decrease confidence
      newConfidence = Math.max(0.0, existing.confidence - 0.15);
      changes.push("confidence_decreased");
    }

    // Apply explicit updates
    if (updates.pattern) {
      changes.push("pattern");
    }
    if (updates.description) {
      changes.push("description");
    }
    if (updates.confidence !== undefined) {
      newConfidence = updates.confidence;
      changes.push("confidence_set");
    }

    const now = new Date().toISOString();

    this.db
      .prepare(`
      UPDATE behavioral_patterns SET
        pattern = COALESCE(?, pattern),
        description = COALESCE(?, description),
        confidence = ?,
        success_count = success_count + ?,
        failure_count = failure_count + ?,
        last_used_at = ?,
        updated_at = ?
      WHERE id = ?
    `)
      .run(
        updates.pattern ? JSON.stringify(updates.pattern) : null,
        updates.description || null,
        newConfidence,
        success ? 1 : 0,
        success ? 0 : 1,
        now,
        now,
        patternId,
      );

    const updated = this.getPattern(patternId);
    if (updated) {
      this.emitEvent({ type: "pattern_updated", pattern: updated, changes });
    }

    return updated;
  }

  /**
   * Update only confidence (for NOOP case)
   */
  updateConfidence(patternId: string, success: boolean): void {
    const existing = this.getPattern(patternId);
    if (!existing) {
      return;
    }

    const oldConfidence = existing.confidence;
    let newConfidence: number;

    if (success) {
      newConfidence = Math.min(1.0, oldConfidence + 0.1 * (1 - oldConfidence));
    } else {
      newConfidence = Math.max(0.0, oldConfidence - 0.15);
    }

    const now = new Date().toISOString();

    this.db
      .prepare(`
      UPDATE behavioral_patterns SET
        confidence = ?,
        success_count = success_count + ?,
        failure_count = failure_count + ?,
        last_used_at = ?,
        updated_at = ?
      WHERE id = ?
    `)
      .run(newConfidence, success ? 1 : 0, success ? 0 : 1, now, now, patternId);

    this.emitEvent({
      type: "confidence_updated",
      patternId,
      oldConfidence,
      newConfidence,
    });
  }

  /**
   * Delete a pattern
   */
  deletePattern(patternId: string, reason: string): boolean {
    const result = this.db.prepare("DELETE FROM behavioral_patterns WHERE id = ?").run(patternId);

    if (result.changes > 0) {
      // Also remove from vector table
      if (this.vectorEnabled) {
        try {
          this.db.prepare("DELETE FROM behavioral_patterns_vec WHERE id = ?").run(patternId);
        } catch {
          // Ignore vector table errors
        }
      }

      this.emitEvent({ type: "pattern_deleted", patternId, reason });
      log.debug("Deleted pattern:", patternId, reason);
      return true;
    }

    return false;
  }

  /**
   * Get a pattern by ID
   */
  getPattern(patternId: string): BehavioralPattern | null {
    const row = this.db.prepare("SELECT * FROM behavioral_patterns WHERE id = ?").get(patternId) as
      | BehavioralPatternRow
      | undefined;

    return row ? this.rowToPattern(row) : null;
  }

  // ===========================================================================
  // PATTERN QUERIES
  // ===========================================================================

  /**
   * Query patterns by tool and context
   */
  queryPatterns(query: PatternQuery): PatternQueryResult {
    const startTime = Date.now();
    const conditions: string[] = ["tool = ?"];
    const params: unknown[] = [query.tool];

    if (query.action) {
      conditions.push("action = ?");
      params.push(query.action);
    }

    if (query.personaId) {
      if (query.includeGlobal !== false) {
        conditions.push("(persona_id = ? OR scope = ?)");
        params.push(query.personaId, "global");
      } else {
        conditions.push("persona_id = ?");
        params.push(query.personaId);
      }
    }

    if (query.minConfidence !== undefined) {
      conditions.push("confidence >= ?");
      params.push(query.minConfidence);
    }

    const limit = query.limit || 10;
    params.push(limit);

    const sql = `
      SELECT * FROM behavioral_patterns
      WHERE ${conditions.join(" AND ")}
      ORDER BY confidence DESC, last_used_at DESC
      LIMIT ?
    `;

    const rows = this.db.prepare(sql).all(...params) as BehavioralPatternRow[];
    const patterns = rows.map((row) => this.rowToPattern(row));

    // Filter by context match
    const filtered = patterns.filter((p) => this.contextMatches(p.context, query.context));

    return {
      patterns: filtered,
      queryTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Find similar patterns using vector search
   */
  async findSimilar(
    embedding: number[],
    options: {
      personaId?: string;
      includeGlobal?: boolean;
      threshold?: number;
      limit?: number;
    } = {},
  ): Promise<SimilarPattern[]> {
    if (!this.vectorEnabled) {
      log.debug("Vector search not available, falling back to empty result");
      return [];
    }

    const threshold = options.threshold ?? 0.85;
    const limit = options.limit ?? 5;

    try {
      // Vector similarity search
      const embeddingStr = `[${embedding.join(",")}]`;

      let sql: string;
      let params: unknown[];

      if (options.personaId && options.includeGlobal !== false) {
        sql = `
          SELECT
            v.id,
            v.distance,
            p.*
          FROM behavioral_patterns_vec v
          JOIN behavioral_patterns p ON v.id = p.id
          WHERE v.embedding MATCH ?
            AND (p.persona_id = ? OR p.scope = 'global')
          ORDER BY v.distance
          LIMIT ?
        `;
        params = [embeddingStr, options.personaId, limit];
      } else if (options.personaId) {
        sql = `
          SELECT
            v.id,
            v.distance,
            p.*
          FROM behavioral_patterns_vec v
          JOIN behavioral_patterns p ON v.id = p.id
          WHERE v.embedding MATCH ?
            AND p.persona_id = ?
          ORDER BY v.distance
          LIMIT ?
        `;
        params = [embeddingStr, options.personaId, limit];
      } else {
        sql = `
          SELECT
            v.id,
            v.distance,
            p.*
          FROM behavioral_patterns_vec v
          JOIN behavioral_patterns p ON v.id = p.id
          WHERE v.embedding MATCH ?
          ORDER BY v.distance
          LIMIT ?
        `;
        params = [embeddingStr, limit];
      }

      const rows = this.db.prepare(sql).all(...params) as (BehavioralPatternRow & {
        distance: number;
      })[];

      return rows
        .map((row) => ({
          pattern: this.rowToPattern(row),
          similarity: 1 - row.distance, // Convert distance to similarity
        }))
        .filter((r) => r.similarity >= threshold);
    } catch (err) {
      log.warn("Vector search failed:", err);
      return [];
    }
  }

  /**
   * Get relevant patterns for a tool call (main entry point for hints)
   */
  getRelevantPatterns(params: {
    tool: string;
    action?: string;
    context: Partial<PatternContext>;
    personaId: string;
    limit?: number;
  }): BehavioralPattern[] {
    const result = this.queryPatterns({
      tool: params.tool,
      action: params.action,
      context: params.context,
      personaId: params.personaId,
      includeGlobal: true,
      minConfidence: this.config.minConfidenceForUse,
      limit: params.limit || 5,
    });

    return result.patterns;
  }

  // ===========================================================================
  // PROMOTION
  // ===========================================================================

  /**
   * Check if a pattern should be promoted to global
   */
  async checkPromotion(
    contextHash: string,
    patternType: string,
    patternData: PatternData,
    personaId: string,
  ): Promise<boolean> {
    const patternDataHash = this.hashPatternData(patternData);

    // Record this persona's success with this pattern
    this.db
      .prepare(`
      INSERT INTO behavioral_promotion_candidates (
        context_hash, pattern_type, pattern_data_hash, persona_id, success_count
      ) VALUES (?, ?, ?, ?, 1)
      ON CONFLICT (context_hash, pattern_type, pattern_data_hash, persona_id)
      DO UPDATE SET success_count = success_count + 1
    `)
      .run(contextHash, patternType, patternDataHash, personaId);

    // Check if promotion criteria are met
    const stats = this.db
      .prepare(`
      SELECT
        COUNT(DISTINCT persona_id) as persona_count,
        SUM(success_count) as total_success
      FROM behavioral_promotion_candidates
      WHERE context_hash = ? AND pattern_type = ? AND pattern_data_hash = ?
    `)
      .get(contextHash, patternType, patternDataHash) as {
      persona_count: number;
      total_success: number;
    };

    return (
      stats.persona_count >= this.config.minPersonasForPromotion &&
      stats.total_success >= this.config.minSuccessForPromotion
    );
  }

  /**
   * Promote a pattern to global scope
   */
  promoteToGlobal(pattern: BehavioralPattern): BehavioralPattern | null {
    if (pattern.scope === "global") {
      return pattern; // Already global
    }

    // Check if similar global pattern exists
    const existing = this.db
      .prepare(`
      SELECT id FROM behavioral_patterns
      WHERE scope = 'global'
        AND tool = ?
        AND context_hash = ?
        AND pattern_type = ?
      LIMIT 1
    `)
      .get(pattern.tool, pattern.contextHash, pattern.patternType) as { id: string } | undefined;

    if (existing) {
      // Update existing global pattern
      this.updatePattern(
        existing.id,
        {
          confidence: Math.max(pattern.confidence, this.getPattern(existing.id)?.confidence || 0),
        },
        true,
      );
      return this.getPattern(existing.id);
    }

    // Create new global pattern
    const extracted: ExtractedPattern = {
      tool: pattern.tool,
      action: pattern.action,
      context: pattern.context,
      contextHash: pattern.contextHash,
      patternType: pattern.patternType,
      pattern: pattern.pattern,
      description: `[Global] ${pattern.description}`,
    };

    const globalPattern = this.addPattern(extracted, null);

    // Copy confidence from source
    this.db
      .prepare(`
      UPDATE behavioral_patterns SET
        confidence = ?,
        success_count = ?,
        failure_count = ?
      WHERE id = ?
    `)
      .run(pattern.confidence, pattern.successCount, pattern.failureCount, globalPattern.id);

    this.emitEvent({ type: "pattern_promoted", pattern: globalPattern });
    log.info("Promoted pattern to global:", globalPattern.id);

    return this.getPattern(globalPattern.id);
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private addPatternEmbedding(patternId: string, embedding: number[]): void {
    try {
      const embeddingStr = `[${embedding.join(",")}]`;
      this.db
        .prepare(`
        INSERT INTO behavioral_patterns_vec (id, embedding)
        VALUES (?, ?)
      `)
        .run(patternId, embeddingStr);
    } catch (err) {
      log.warn("Failed to add pattern embedding:", err);
    }
  }

  private rowToPattern(row: BehavioralPatternRow): BehavioralPattern {
    return {
      id: row.id,
      personaId: row.persona_id,
      scope: row.scope as "persona" | "global",
      tool: row.tool,
      action: row.action || undefined,
      patternType: row.pattern_type as BehavioralPattern["patternType"],
      context: JSON.parse(row.context) as PatternContext,
      contextHash: row.context_hash,
      pattern: JSON.parse(row.pattern) as PatternData,
      description: row.description,
      confidence: row.confidence,
      successCount: row.success_count,
      failureCount: row.failure_count,
      lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private contextMatches(
    patternContext: PatternContext,
    queryContext: Partial<PatternContext>,
  ): boolean {
    // All specified query context fields must match
    for (const [key, value] of Object.entries(queryContext)) {
      if (value === undefined) {
        continue;
      }
      if ((patternContext as Record<string, unknown>)[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private hashPatternData(data: PatternData): string {
    return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex").substring(0, 16);
  }

  /**
   * Get store statistics
   */
  getStats() {
    return getBehavioralStats(this.db);
  }
}

// Type for database rows
interface BehavioralPatternRow {
  id: string;
  persona_id: string | null;
  scope: string;
  tool: string;
  action: string | null;
  pattern_type: string;
  context: string;
  context_hash: string;
  pattern: string;
  description: string;
  confidence: number;
  success_count: number;
  failure_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

// Re-export default config
export { DEFAULT_BEHAVIORAL_CONFIG } from "../types.js";
