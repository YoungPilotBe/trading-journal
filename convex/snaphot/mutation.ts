import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { statusUnion } from "../constants/unions";

export const updateSnapshot = mutation({
  args: {
    snapshotId: v.id("snapshots"),
    status: v.optional(statusUnion),
    tags: v.optional(v.any()),
  },
  handler: async (ctx, { snapshotId, ...updates }) => {
    return await ctx.db.patch(snapshotId, { ...updates });
  },
});
