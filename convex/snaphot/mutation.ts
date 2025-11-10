import { ConvexError, v } from "convex/values";
import { api, internal } from "../_generated/api";
import { mutation } from "../_generated/server";
import { emotionUnion, resultUnion, statusUnion } from "../constants/unions";

export const updateSnapshot = mutation({
  args: {
    snapshotId: v.id("snapshots"),
    status: v.optional(statusUnion),
    emotion: v.optional(emotionUnion),
    tags: v.optional(v.any()),
    tags_config: v.optional(v.any()),
  },
  handler: async (ctx, { snapshotId, ...args }) => {
    const snapshot = await ctx.runQuery(api.snaphot.queries.getSnapshot, {
      id: snapshotId,
    });

    // Delete the snapshot tags when the status is being changed
    if (snapshot?.status !== args.status) {
      await ctx.runMutation(internal.snaphot.internal.removeTagMetadata, {
        snapshotId,
      });
    }

    return await ctx.db.patch(snapshotId, { ...args });
  },
});

export const createSnapshot = mutation({
  args: {
    tradeSetupId: v.id("trade_setups"),
    status: statusUnion,
    imageId: v.id("tradingview_images"),
    result: v.optional(resultUnion),
    emotion: v.union(emotionUnion, v.null()),
    timeframe: v.string(),
  },
  handler: async (
    ctx,
    { imageId, tradeSetupId, status, result, timeframe, emotion }
  ) => {
    const now = Date.now();

    const snapshotId = await ctx.db.insert("snapshots", {
      tradeSetupId,
      status: status,
      imageId: imageId,
      timeframe,
      emotion: emotion ?? undefined,
      createdAt: now,
    });

    if (result) {
      await ctx.runMutation(api.trade_setup.mutations.updateTradeSetup, {
        id: tradeSetupId,
        snapshotId,
        result,
        imageId,
        emotion,
      });
    }

    await ctx.db.patch(imageId, {
      snapshotId,
      timeframe,
      onboarding_complete: true,
    });

    return { tradeSetupId, snapshotId };
  },
});

export const deleteSnapshot = mutation({
  args: {
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, { snapshotId }) => {
    // Get the snapshot being deleted
    const snapshot = await ctx.db
      .query("snapshots")
      .withIndex("by_id", (q) => q.eq("_id", snapshotId))
      .unique();

    if (!snapshot) throw new ConvexError("No snapshot found to delete");

    // Find the previous snapshot in the same trade setup
    const previousSnapshot = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", snapshot.tradeSetupId)
      )
      .filter((q) => q.lt(q.field("createdAt"), snapshot.createdAt))
      .order("desc")
      .first();

    // Prevent deletion of the last snapshot
    if (!previousSnapshot) {
      throw new ConvexError(
        "Cannot delete the last snapshot. A trade setup must have at least one snapshot."
      );
    }

    // Delete the current snapshot
    await ctx.runMutation(internal.snaphot.services.cascadeDeleteSnapshot, {
      snapshotId: snapshot._id,
    });

    // Return the previous snapshot ID
    return {
      previousSnapshotId: previousSnapshot._id,
      tradeSetupId: previousSnapshot.tradeSetupId,
    };
  },
});
