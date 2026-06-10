import { Type } from "typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";

/**
 * Skill operation result
 */
export type HermesSkillResult = {
  success: boolean;
  message?: string;
  error?: string;
  skill_name?: string;
  skill_path?: string;
};

/**
 * Handler interface for Hermes skill operations
 * Platform provides the implementation that bridges to the Python Hermes service
 */
export type HermesSkillsHandler = {
  /** Create a new skill */
  createSkill: (params: {
    name: string;
    content: string;
    category?: string;
  }) => Promise<HermesSkillResult>;

  /** Edit an existing skill */
  editSkill: (params: { name: string; content: string }) => Promise<HermesSkillResult>;

  /** Delete a skill */
  deleteSkill: (params: { name: string }) => Promise<HermesSkillResult>;

  /** List all skills */
  listSkills: () => Promise<string[]>;

  /** Get skill content */
  getSkill: (name: string) => Promise<{ content: string | null; error?: string }>;
};

const HermesSkillCreateSchema = Type.Object({
  name: Type.String({
    description: "Skill name (lowercase, hyphens allowed, e.g., 'code-review', 'data-analysis')",
  }),
  content: Type.String({
    description: "Skill content in SKILL.md format with YAML frontmatter and markdown body",
  }),
  category: Type.Optional(
    Type.String({ description: "Optional category folder (e.g., 'development', 'analysis')" }),
  ),
});

const HermesSkillEditSchema = Type.Object({
  name: Type.String({ description: "Name of the skill to edit" }),
  content: Type.String({ description: "New skill content (replaces entire SKILL.md)" }),
});

const HermesSkillDeleteSchema = Type.Object({
  name: Type.String({ description: "Name of the skill to delete" }),
});

const HermesSkillGetSchema = Type.Object({
  name: Type.String({ description: "Name of the skill to read" }),
});

const HermesSkillListSchema = Type.Object({});

/**
 * Create the hermes_skill_create tool
 */
export function createHermesSkillCreateTool(handler: HermesSkillsHandler): AnyAgentTool {
  return {
    label: "Create Skill",
    name: "hermes_skill_create",
    description: `Create a new reusable skill that persists across conversations.

Skills are markdown files with YAML frontmatter that define reusable capabilities.

SKILL.md format:
\`\`\`markdown
---
name: skill-name
description: Brief description of what this skill does
version: 1.0.0
triggers:
  - keyword1
  - keyword2
---

# Skill Name

Instructions and context for when this skill is activated.

## Steps
1. First step
2. Second step

## Examples
- Example usage
\`\`\`

Use this for:
- Recurring tasks the user asks for frequently
- Domain-specific knowledge and procedures
- Custom workflows and processes

Skills are automatically loaded when trigger keywords match.`,
    parameters: HermesSkillCreateSchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const name = readStringParam(params, "name", { required: true });
        const content = readStringParam(params, "content", { required: true });
        const category = readStringParam(params, "category");

        // Validate skill name format
        if (!/^[a-z][a-z0-9-]*$/.test(name)) {
          return jsonResult({
            success: false,
            error:
              "Skill name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens",
          });
        }

        const result = await handler.createSkill({
          name,
          content,
          category: category || undefined,
        });

        return jsonResult(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the hermes_skill_edit tool
 */
export function createHermesSkillEditTool(handler: HermesSkillsHandler): AnyAgentTool {
  return {
    label: "Edit Skill",
    name: "hermes_skill_edit",
    description: `Edit an existing skill's content.

Use hermes_skill_get first to read current content, then modify and save.`,
    parameters: HermesSkillEditSchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const name = readStringParam(params, "name", { required: true });
        const content = readStringParam(params, "content", { required: true });

        const result = await handler.editSkill({ name, content });
        return jsonResult(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the hermes_skill_delete tool
 */
export function createHermesSkillDeleteTool(handler: HermesSkillsHandler): AnyAgentTool {
  return {
    label: "Delete Skill",
    name: "hermes_skill_delete",
    description: `Delete a skill permanently.

Use hermes_skill_list to see available skills first.`,
    parameters: HermesSkillDeleteSchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const name = readStringParam(params, "name", { required: true });
        const result = await handler.deleteSkill({ name });
        return jsonResult(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the hermes_skill_list tool
 */
export function createHermesSkillListTool(handler: HermesSkillsHandler): AnyAgentTool {
  return {
    label: "List Skills",
    name: "hermes_skill_list",
    description: `List all available skills.

Returns skill names that can be used with hermes_skill_get or hermes_skill_delete.`,
    parameters: HermesSkillListSchema,
    execute: async () => {
      try {
        const skills = await handler.listSkills();
        return jsonResult({
          skills,
          count: skills.length,
          isEmpty: skills.length === 0,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create the hermes_skill_get tool
 */
export function createHermesSkillGetTool(handler: HermesSkillsHandler): AnyAgentTool {
  return {
    label: "Get Skill",
    name: "hermes_skill_get",
    description: `Read a skill's content.

Use before editing to see current content.`,
    parameters: HermesSkillGetSchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const name = readStringParam(params, "name", { required: true });
        const result = await handler.getSkill(name);

        if (result.error) {
          return jsonResult({ success: false, error: result.error });
        }

        return jsonResult({
          success: true,
          name,
          content: result.content,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

/**
 * Create all Hermes skills tools
 */
export function createHermesSkillsTools(handler: HermesSkillsHandler): AnyAgentTool[] {
  return [
    createHermesSkillListTool(handler),
    createHermesSkillGetTool(handler),
    createHermesSkillCreateTool(handler),
    createHermesSkillEditTool(handler),
    createHermesSkillDeleteTool(handler),
  ];
}
