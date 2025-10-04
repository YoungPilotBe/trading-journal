import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createNote = mutation({
  args: {
    snapshotId: v.id("snapshots"),
  },
  returns: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, { snapshotId }) => {
    const now = Date.now();

    // Create the note
    const noteId = await ctx.db.insert("notes", {
      snapshotId,
      title: "Untitled",
      createdAt: now,
      updatedAt: now,
    });

    return { noteId };
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    title: v.optional(v.string()),
    document: v.optional(v.any()),
  },
  handler: async (ctx, { noteId, title, document }) => {
    await ctx.db.patch(noteId, {
      updatedAt: Date.now(),
      ...(title !== undefined && { title }),
      ...(document !== undefined && { document }),
    });
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, { noteId }) => {
    await ctx.db.delete(noteId);
  },
});
