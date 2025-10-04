import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { mutation } from "../_generated/server";
import { resultUnion, statusUnion } from "../constants/unions";

export const updateSnapshot = mutation({
  args: {
    snapshotId: v.id("snapshots"),
    status: v.optional(statusUnion),
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
    timeframe: v.string(),
  },
  handler: async (
    ctx,
    { imageId, tradeSetupId, status, result, timeframe }
  ) => {
    const now = Date.now();

    const snapshotId = await ctx.db.insert("snapshots", {
      tradeSetupId,
      status: status,
      imageId: imageId,
      timeframe,
      createdAt: now,
    });

    if (result) {
      await ctx.runMutation(api.trade_setup.mutations.updateTradeSetup, {
        id: tradeSetupId,
        snapshotId,
        result,
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
