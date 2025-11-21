import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { internalMutation, mutation } from "../_generated/server";
import {
  emotionUnion,
  resultUnion,
  statusUnion,
  tpslSchema,
} from "../constants/unions";

export const createTradeSetupWithSnapshot = mutation({
  args: {
    tradeSetup: v.object({
      title: v.string(),
      asset: v.string(),
      direction: v.union(v.literal("long"), v.literal("short")),
      result: v.optional(resultUnion),
    }),
    snapshot: v.object({
      timeframes: v.array(v.string()),
      status: statusUnion,
      emotion: v.optional(emotionUnion),
      rMultiple: v.optional(v.number()),
    }),
    imageId: v.id("tradingview_images"),
    tpsl: tpslSchema,
  },
  returns: {
    tradeSetupId: v.id("trade_setups"),
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, { tradeSetup, snapshot, imageId, tpsl }) => {
    // tpsl is optional and will be processed in a future update
    // For now, it's accepted but not persisted (client-side only)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    void tpsl;
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

    await ctx.runMutation(api.tpsl.mutations.upsertTpslEntries, {
      snapshotId,
      tpsl,
    });

    // Link the image to this snapshot (use first timeframe for image field)
    await ctx.db.patch(imageId, {
      snapshotId,
      timeframe: snapshot.timeframes[0],
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

export const deleteTpslEntriesBySnapshotId = internalMutation({
  args: {
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, { snapshotId }) => {
    // Find all TP/SL entries linked to this snapshot
    const tpslEntries = await ctx.db
      .query("tpsl_entries")
      .withIndex("by_snapshot", (q) => q.eq("snapshotId", snapshotId))
      .collect();

    const deletedIds = [];

    // Delete each TP/SL entry
    for (const entry of tpslEntries) {
      await ctx.db.delete(entry._id);
      deletedIds.push(entry._id);
    }

    return deletedIds; // Return array of deleted TP/SL entry IDs
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
