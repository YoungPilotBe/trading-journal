import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation, mutation } from "../_generated/server";
import { emotionUnion, resultUnion, statusUnion } from "../constants/unions";

export const createTradeSetupWithSnapshot = mutation({
  args: {
    tradeSetup: v.object({
      title: v.string(),
      asset: v.string(),
      direction: v.union(v.literal("long"), v.literal("short")),
      timeframes: v.array(v.string()),
      result: v.optional(resultUnion),
    }),
    snapshot: v.object({
      timeframe: v.string(),
      status: statusUnion,
      emotion: v.optional(emotionUnion),
      riskReward: v.optional(v.number()),
    }),
    imageId: v.id("tradingview_images"),
  },
  returns: {
    tradeSetupId: v.id("trade_setups"),
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, { tradeSetup, snapshot, imageId }) => {
    const now = Date.now();

    // Create the trade setup
    const tradeSetupId = await ctx.db.insert("trade_setups", {
      ...tradeSetup,
      createdAt: now,
      updatedAt: now,
    });

    // Create the snapshot
    const snapshotId = await ctx.db.insert("snapshots", {
      ...snapshot,
      tradeSetupId,
      imageId,
      emotion: snapshot.emotion ?? undefined,
      createdAt: now,
    });

    // Link the image to this snapshot
    await ctx.db.patch(imageId, {
      snapshotId,
      timeframe: snapshot.timeframe,
      onboarding_complete: true,
    });

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

export const deleteNotesBySnapshotId = internalMutation({
  args: {
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, { snapshotId }) => {
    // Find all images linked to this snapshot
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_snapshot", (q) => q.eq("snapshotId", snapshotId))
      .collect();

    const deletedIds = [];

    // Delete each image from storage and table
    for (const note of notes) {
      // Delete from storage first
      await ctx.db.delete(note._id);

      deletedIds.push(note._id);
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
