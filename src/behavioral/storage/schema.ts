/**
 * Behavioral Learning Storage Schema
 *
 * SQLite schema for storing behavioral patterns.
 * Uses sqlite-vec for vector similarity search (same as OpenClaw memory).
 */

import type { DatabaseSync } from "node:sqlite";
import { createSubsystemLogger } from "../../logging/subsystem.js";

const log = createSubsystemLogger("behavioral/schema");

export const SCHEMA_VERSION = 1;

/**
 * Initialize behavioral learning tables in SQLite database
 */
export function initBehavioralSchema(db: DatabaseSync): void {
  log.debug("Initializing behavioral learning schema...");

  // Check if schema already exists
  const existingVersion = getSchemaVersion(db);
  if (existingVersion === SCHEMA_VERSION) {
    log.debug("Schema already at version", SCHEMA_VERSION);
    return;
  }

  if (existingVersion > 0 && existingVersion < SCHEMA_VERSION) {
    log.info("Migrating schema from version", existingVersion, "to", SCHEMA_VERSION);
    migrateSchema(db, existingVersion);
    return;
  }

  // Create fresh schema
  db.exec(`
    -- Schema metadata
    CREATE TABLE IF NOT EXISTS behavioral_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Main patterns table
    CREATE TABLE IF NOT EXISTS behavioral_patterns (
      id TEXT PRIMARY KEY,
      persona_id TEXT,                    -- NULL for global patterns
      scope TEXT NOT NULL CHECK (scope IN ('persona', 'global')),

      -- Tool context
      tool TEXT NOT NULL,
      action TEXT,

      -- Pattern classification
      pattern_type TEXT NOT NULL,

      -- Context (JSON)
      context TEXT NOT NULL,
      context_hash TEXT NOT NULL,

      -- Pattern data (JSON)
      pattern TEXT NOT NULL,
      description TEXT NOT NULL,

      -- Confidence metrics
      confidence REAL NOT NULL DEFAULT 0.5,
      success_count INTEGER NOT NULL DEFAULT 0,
      failure_count INTEGER NOT NULL DEFAULT 0,

      -- Timestamps
      last_used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes for fast lookups
    CREATE INDEX IF NOT EXISTS idx_bp_persona_tool
      ON behavioral_patterns(persona_id, tool);

    CREATE INDEX IF NOT EXISTS idx_bp_tool_action
      ON behavioral_patterns(tool, action);

    CREATE INDEX IF NOT EXISTS idx_bp_context_hash
      ON behavioral_patterns(context_hash);

    CREATE INDEX IF NOT EXISTS idx_bp_global
      ON behavioral_patterns(scope) WHERE scope = 'global';

    CREATE INDEX IF NOT EXISTS idx_bp_confidence
      ON behavioral_patterns(confidence DESC);

    CREATE INDEX IF NOT EXISTS idx_bp_pattern_type
      ON behavioral_patterns(pattern_type);

    -- Observations table (recent observations for analysis)
    CREATE TABLE IF NOT EXISTS behavioral_observations (
      id TEXT PRIMARY KEY,
      persona_id TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),

      -- Tool info
      tool TEXT NOT NULL,
      action TEXT,
      params TEXT NOT NULL,               -- JSON

      -- Context
      context TEXT NOT NULL,              -- JSON

      -- Result
      success INTEGER NOT NULL,           -- 0 or 1
      result TEXT,                        -- JSON (nullable)
      error TEXT,                         -- JSON (nullable)

      -- Metrics
      duration_ms INTEGER NOT NULL,
      retry_count INTEGER DEFAULT 0,

      -- Hints used
      hints_used TEXT                     -- JSON array of pattern IDs
    );

    -- Index for recent observations
    CREATE INDEX IF NOT EXISTS idx_bo_persona_time
      ON behavioral_observations(persona_id, timestamp DESC);

    CREATE INDEX IF NOT EXISTS idx_bo_tool_action
      ON behavioral_observations(tool, action);

    -- Cleanup old observations (keep last 7 days per persona)
    -- This is handled by a periodic cleanup job

    -- Pattern promotion tracking
    CREATE TABLE IF NOT EXISTS behavioral_promotion_candidates (
      context_hash TEXT NOT NULL,
      pattern_type TEXT NOT NULL,
      pattern_data_hash TEXT NOT NULL,    -- Hash of pattern data
      persona_id TEXT NOT NULL,
      success_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),

      PRIMARY KEY (context_hash, pattern_type, pattern_data_hash, persona_id)
    );

    CREATE INDEX IF NOT EXISTS idx_bpc_context
      ON behavioral_promotion_candidates(context_hash, pattern_type);
  `);

  // Set schema version
  db.exec(`
    INSERT OR REPLACE INTO behavioral_meta (key, value)
    VALUES ('schema_version', '${SCHEMA_VERSION}');
  `);

  log.info("Behavioral learning schema initialized at version", SCHEMA_VERSION);
}

/**
 * Initialize vector table for similarity search
 * Requires sqlite-vec extension to be loaded
 */
export function initBehavioralVectorTable(db: DatabaseSync, dims: number = 1536): boolean {
  try {
    // Check if sqlite-vec is available
    const result = db.prepare("SELECT sqlite_version()").get();
    if (!result) {
      log.warn("Cannot verify SQLite version");
      return false;
    }

    // Try to create the virtual table
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS behavioral_patterns_vec USING vec0(
        id TEXT PRIMARY KEY,
        embedding FLOAT[${dims}]
      );
    `);

    log.info("Behavioral vector table initialized with", dims, "dimensions");
    return true;
  } catch (err) {
    log.warn("Failed to create vector table (sqlite-vec may not be loaded):", err);
    return false;
  }
}

/**
 * Get current schema version
 */
function getSchemaVersion(db: DatabaseSync): number {
  try {
    const result = db
      .prepare("SELECT value FROM behavioral_meta WHERE key = 'schema_version'")
      .get() as { value: string } | undefined;

    return result ? parseInt(result.value, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Migrate schema from older version
 */
function migrateSchema(db: DatabaseSync, _fromVersion: number): void {
  // Future migrations go here (use _fromVersion when needed)
  // For now, just update version
  db.exec(`
    INSERT OR REPLACE INTO behavioral_meta (key, value)
    VALUES ('schema_version', '${SCHEMA_VERSION}');
  `);
}

/**
 * Cleanup old observations (called periodically)
 */
export function cleanupOldObservations(db: DatabaseSync, maxAgeDays: number = 7): number {
  const result = db
    .prepare(`
    DELETE FROM behavioral_observations
    WHERE timestamp < datetime('now', '-' || ? || ' days')
  `)
    .run(maxAgeDays);

  const deleted = result.changes;
  if (deleted > 0) {
    log.info("Cleaned up", deleted, "old observations");
  }

  return deleted;
}

/**
 * Decay confidence of unused patterns (called periodically)
 */
export function decayPatternConfidence(
  db: DatabaseSync,
  decayRate: number = 0.01,
  minConfidence: number = 0.1,
): number {
  // Decay patterns not used in the last 7 days
  const result = db
    .prepare(`
    UPDATE behavioral_patterns
    SET
      confidence = MAX(?, confidence - ?),
      updated_at = datetime('now')
    WHERE
      last_used_at < datetime('now', '-7 days')
      AND confidence > ?
  `)
    .run(minConfidence, decayRate, minConfidence);

  const updated = result.changes;
  if (updated > 0) {
    log.debug("Decayed confidence for", updated, "patterns");
  }

  return updated;
}

/**
 * Get database statistics
 */
export function getBehavioralStats(db: DatabaseSync): {
  totalPatterns: number;
  globalPatterns: number;
  personaPatterns: number;
  totalObservations: number;
  avgConfidence: number;
} {
  const patterns = db
    .prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN scope = 'global' THEN 1 ELSE 0 END) as global,
      SUM(CASE WHEN scope = 'persona' THEN 1 ELSE 0 END) as persona,
      AVG(confidence) as avg_confidence
    FROM behavioral_patterns
  `)
    .get() as {
    total: number;
    global: number;
    persona: number;
    avg_confidence: number;
  };

  const observations = db
    .prepare("SELECT COUNT(*) as count FROM behavioral_observations")
    .get() as { count: number };

  return {
    totalPatterns: patterns.total || 0,
    globalPatterns: patterns.global || 0,
    personaPatterns: patterns.persona || 0,
    totalObservations: observations.count || 0,
    avgConfidence: patterns.avg_confidence || 0,
  };
}
