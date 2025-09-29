import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const removeTagMetadata = internalMutation({
  args: {
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, { snapshotId }) => {
    return await ctx.db.patch(snapshotId, {
      tags: undefined,
      tags_config: undefined,
    });
  },
});
