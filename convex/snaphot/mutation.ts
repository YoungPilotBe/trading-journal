import { ConvexError, v } from "convex/values";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import {
  emotionUnion,
  resultUnion,
  statusUnion,
  tpslSchema,
} from "../constants/unions";

export const updateSnapshot = mutation({
  args: {
    snapshotId: v.id("snapshots"),
    status: v.optional(statusUnion),
    emotion: v.optional(emotionUnion),
    tags: v.optional(v.any()),
    tags_config: v.optional(v.any()),
    rMultiple: v.optional(v.number()),
    timeframes: v.optional(v.array(v.string())),
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
    emotion: v.optional(emotionUnion),
    timeframes: v.array(v.string()),
    rMultiple: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (
    ctx,
    { imageId, tradeSetupId, status, timeframes, emotion, rMultiple }
  ) => {
    const now = Date.now();

    const snapshotId = await ctx.db.insert("snapshots", {
      tradeSetupId,
      status: status,
      imageId: imageId,
      timeframes,
      emotion: emotion ?? undefined,
      rMultiple: rMultiple ?? undefined,
      createdAt: now,
    });

    // if (result) {
    //   await ctx.runMutation(api.trade_setup.mutations.updateTradeSetup, {
    //     id: tradeSetupId,
    //     result,
    //   });
    // }

    // Store the first timeframe on the image for backward compatibility
    await ctx.db.patch(imageId, {
      snapshotId,
      timeframe: timeframes[0],
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

export const attachSnapshot = mutation({
  args: {
    tradeSetup: v.object({
      id: v.id("trade_setups"),
      title: v.optional(v.string()),
      result: v.optional(resultUnion),
    }),
    snapshot: v.object({
      timeframes: v.array(v.string()),
      status: statusUnion,
      emotion: v.optional(emotionUnion),
      rMultiple: v.optional(v.number()),
      imageId: v.id("tradingview_images"),
    }),
    tpsl: tpslSchema,
  },

  handler: async (
    ctx,
    args
  ): Promise<{
    snapshotId: Id<"snapshots">;
    tradeSetupId: Id<"trade_setups">;
  }> => {
    // Check if the trade setup exists
    const tradeSetup = await ctx.runQuery(
      api.trade_setup.queries.getTradeSetup,
      {
        id: args.tradeSetup.id,
      }
    );

    if (!tradeSetup)
      throw new ConvexError("No trade setup found to attach the snapshot too");

    await ctx.runMutation(api.trade_setup.mutations.updateTradeSetup, {
      ...args.tradeSetup,
    });

    const snapshot = await ctx.runMutation(
      api.snaphot.mutation.createSnapshot,
      {
        ...args.snapshot,
        tradeSetupId: tradeSetup._id,
      }
    );

    // Upsert TP/SL entries if provided (updates existing entries with _id, creates new ones without)
    if (args.tpsl) {
      await ctx.runMutation(api.tpsl.mutations.upsertTpslEntries, {
        snapshotId: snapshot.snapshotId,
        tpsl: args.tpsl,
      });
    }

    await ctx.runMutation(api.tradingview_images.mutations.updateImage, {
      id: args.snapshot.imageId,
      timeframe: args.snapshot.timeframes[0], // Use first timeframe for image
      snapshotId: snapshot.snapshotId,
    });

    return snapshot;
  },
});

export const removeTimeframeFromAllSnapshots = mutation({
  args: {
    tradeSetupId: v.id("trade_setups"),
    timeframe: v.string(),
  },
  handler: async (ctx, { tradeSetupId, timeframe }) => {
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", tradeSetupId)
      )
      .collect();

    let updatedCount = 0;

    for (const snapshot of snapshots) {
      if (snapshot.timeframes?.includes(timeframe)) {
        const updatedTimeframes = snapshot.timeframes.filter(
          (tf) => tf !== timeframe
        );

        await ctx.db.patch(snapshot._id, {
          timeframes: updatedTimeframes,
        });

        updatedCount++;
      }
    }

    return { updatedCount };
  },
});
