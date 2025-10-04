import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation, mutation } from "../_generated/server";
import { resultUnion, statusUnion } from "../constants/unions";

export const createTradeSetupWithSnapshot = mutation({
  args: {
    title: v.string(),
    asset: v.string(),
    direction: v.union(v.literal("long"), v.literal("short")),
    status: statusUnion,
    riskReward: v.union(v.number(), v.null()),
    timeframes: v.array(v.string()),
    timeframe: v.optional(v.string()),
    result: v.optional(resultUnion),
    imageId: v.id("tradingview_images"), // Link to the image that triggered this trade setup
  },
  returns: {
    tradeSetupId: v.id("trade_setups"),
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create the trade setup
    const tradeSetupId = await ctx.db.insert("trade_setups", {
      title: args.title,
      asset: args.asset,
      direction: args.direction,
      riskReward: args.riskReward,
      timeframes: args.timeframes,
      result: args.result,
      createdAt: now,
      updatedAt: now,
    });

    const snapshotId = await ctx.db.insert("snapshots", {
      tradeSetupId,
      timeframe: args.timeframe,
      status: args.status,
      imageId: args.imageId,
      createdAt: now,
    });

    // If an image was provided, link it to this trade setup
    if (args.imageId) {
      await ctx.db.patch(args.imageId, {
        snapshotId,
        timeframe: args.timeframe,
        onboarding_complete: true,
      });
    }

    return { tradeSetupId, snapshotId };
  },
});

export const deleteImagesBySnapshotId = internalMutation({
  args: {
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, { snapshotId }) => {
    // Find all images linked to this snapshot
    const images = await ctx.db
      .query("tradingview_images")
      .withIndex("by_snapshot", (q) => q.eq("snapshotId", snapshotId))
      .collect();

    const deletedIds = [];

    // Delete each image from storage and table
    for (const image of images) {
      // Delete from storage first
      await ctx.storage.delete(image.storageId);

      // Then delete from the table
      await ctx.db.delete(image._id);

      deletedIds.push(image._id);
    }

    return deletedIds; // Return array of deleted image IDs
  },
});

export const deleteSnapshotsByTradeSetupId = internalMutation({
  args: {
    tradeSetupId: v.id("trade_setups"),
  },
  handler: async (ctx, { tradeSetupId }) => {
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup", (q) => q.eq("tradeSetupId", tradeSetupId))
      .collect();

    for (const snapshot of snapshots) {
      await ctx.runMutation(internal.snaphot.services.cascadeDeleteSnapshot, {
        snapshotId: snapshot._id,
      });
    }
  },
});
