import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";

export type InstagramHandler = {
  igSetup: (username: string, password: string, otpSecret?: string) => Promise<{ ok: boolean; message: string; username?: string }>;
  igCheck: () => Promise<{ loggedIn: boolean; username?: string }>;
  igPost: (caption: string, imageUrl?: string) => Promise<{ ok: boolean; postUrl?: string; message: string }>;
  igReply: (postUrl: string, comment: string) => Promise<{ ok: boolean; message: string }>;
  igLike: (postUrl: string) => Promise<{ ok: boolean; message: string }>;
  igFollow: (username: string) => Promise<{ ok: boolean; message: string }>;
  igProfile: (username?: string) => Promise<{ ok: boolean; followers?: number; following?: number; posts?: number; bio?: string; message?: string }>;
};

const IgSetupSchema = Type.Object({
  username: Type.String({ description: "Instagram username" }),
  password: Type.String({ description: "Instagram password" }),
  otpSecret: Type.Optional(Type.String({ description: "Optional OTP secret for two-factor authentication" })),
});

const IgCheckSchema = Type.Object({});

const IgPostSchema = Type.Object({
  caption: Type.String({ description: "Caption for the post" }),
  imageUrl: Type.Optional(Type.String({ description: "Optional URL to image to post" })),
});

const IgReplySchema = Type.Object({
  postUrl: Type.String({ description: "URL of the Instagram post to reply to" }),
  comment: Type.String({ description: "Comment text to add as a reply" }),
});

const IgLikeSchema = Type.Object({
  postUrl: Type.String({ description: "URL of the Instagram post to like" }),
});

const IgFollowSchema = Type.Object({
  username: Type.String({ description: "Instagram username to follow" }),
});

const IgProfileSchema = Type.Object({
  username: Type.Optional(Type.String({ description: "Instagram username to view profile for (defaults to logged-in user)" })),
});

export function createIgSetupTool(handler: InstagramHandler): AnyAgentTool {
  return {
    label: "Instagram Setup",
    name: "ig_setup",
    description: `Log in to Instagram with username, password, and optional OTP secret.`,
    parameters: IgSetupSchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const username = readStringParam(params, "username", { required: true });
        const password = readStringParam(params, "password", { required: true });
        const otpSecret = readStringParam(params, "otpSecret", { required: false });

        const result = await handler.igSetup(username, password, otpSecret);
        return jsonResult(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

export function createIgCheckTool(handler: InstagramHandler): AnyAgentTool {
  return {
    label: "Instagram Check",
    name: "ig_check",
    description: `Check current login status and username on Instagram.`,
    parameters: IgCheckSchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const result = await handler.igCheck();
        return jsonResult(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

export function createIgPostTool(handler: InstagramHandler): AnyAgentTool {
  return {
    label: "Instagram Post",
    name: "ig_post",
    description: `Post a photo with caption to Instagram.`,
    parameters: IgPostSchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const caption = readStringParam(params, "caption", { required: true });
        const imageUrl = readStringParam(params, "imageUrl", { required: false });

        const result = await handler.igPost(caption, imageUrl);
        return jsonResult(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

export function createIgReplyTool(handler: InstagramHandler): AnyAgentTool {
  return {
    label: "Instagram Reply",
    name: "ig_reply",
    description: `Reply to an Instagram post with a comment.`,
    parameters: IgReplySchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const postUrl = readStringParam(params, "postUrl", { required: true });
        const comment = readStringParam(params, "comment", { required: true });

        const result = await handler.igReply(postUrl, comment);
        return jsonResult(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

export function createIgLikeTool(handler: InstagramHandler): AnyAgentTool {
  return {
    label: "Instagram Like",
    name: "ig_like",
    description: `Like an Instagram post by URL.`,
    parameters: IgLikeSchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const postUrl = readStringParam(params, "postUrl", { required: true });

        const result = await handler.igLike(postUrl);
        return jsonResult(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

export function createIgFollowTool(handler: InstagramHandler): AnyAgentTool {
  return {
    label: "Instagram Follow",
    name: "ig_follow",
    description: `Follow an Instagram user by username.`,
    parameters: IgFollowSchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const username = readStringParam(params, "username", { required: true });

        const result = await handler.igFollow(username);
        return jsonResult(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

export function createIgProfileTool(handler: InstagramHandler): AnyAgentTool {
  return {
    label: "Instagram Profile",
    name: "ig_profile",
    description: `View an Instagram user's profile (or current user if no username provided).`,
    parameters: IgProfileSchema,
    execute: async (_toolCallId, rawParams) => {
      const params = rawParams as Record<string, unknown>;
      try {
        const username = readStringParam(params, "username", { required: false });

        const result = await handler.igProfile(username);
        return jsonResult(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResult({ error: message });
      }
    },
  };
}

export function createInstagramTools(handler: InstagramHandler): AnyAgentTool[] {
  return [
    createIgSetupTool(handler),
    createIgCheckTool(handler),
    createIgPostTool(handler),
    createIgReplyTool(handler),
    createIgLikeTool(handler),
    createIgFollowTool(handler),
    createIgProfileTool(handler),
  ];
}
