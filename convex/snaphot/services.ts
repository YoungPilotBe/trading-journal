import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";

export const cascadeDeleteSnapshot = internalMutation({
  args: {
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, args) => {
    // delete the images
    await ctx.runMutation(
      internal.orchestration.mutations.deleteImagesBySnapshotId,
      args
    );
    await ctx.runMutation(
      internal.orchestration.mutations.deleteNotesBySnapshotId,
      args
    );

    // delete the snapshot itself
    await ctx.db.delete(args.snapshotId);

    return args.snapshotId;
  },
});
