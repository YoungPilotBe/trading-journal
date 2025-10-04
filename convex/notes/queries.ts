import { v } from "convex/values";
import { query } from "../_generated/server";

export const getNote = query({
  args: {
    id: v.id("notes"),
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getNotesSnapshot = query({
  args: {
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, { snapshotId }) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_snapshot", (q) => q.eq("snapshotId", snapshotId))
      .collect();
  },
});
