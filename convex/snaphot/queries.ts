import { v } from "convex/values";
import { query } from "../_generated/server";
import { sortBy, sortOrder, statusUnion } from "../constants/unions";

export const getSnapshot = query({
  args: {
    id: v.id("snapshots"),
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});
export const getSnapshotByTradeSetup = query({
  args: {
    tradeSetupId: v.id("trade_setups"),
    sortBy,
    sortOrder,
  },
  handler: async (ctx, { tradeSetupId }) => {
    return await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup", (q) => q.eq("tradeSetupId", tradeSetupId))
      .collect();
  },
});

export const getSnapshotByImageId = query({
  args: {
    imageId: v.id("tradingview_images"),
  },
  handler: async (ctx, { imageId }) => {
    return await ctx.db
      .query("snapshots")
      .withIndex("by_image_id", (q) => q.eq("imageId", imageId))
      .collect();
  },
});

export const getMostRecentSnapshotByTradeSetupId = query({
  args: {
    tradeSetupId: v.id("trade_setups"),
  },
  handler: async (ctx, { tradeSetupId }) => {
    return await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", tradeSetupId)
      )
      .order("desc")
      .first();
  },
});

export const getMostRecentSnapshots = query({
  args: {
    status: v.optional(statusUnion),
  },
  handler: async (ctx, { status }) => {
    // Get all snapshots, ordered by creation time (most recent first)
    const allSnapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_created_at")
      .order("desc")
      .collect();

    // Group snapshots by tradeSetupId and keep only the most recent one for each
    const mostRecentByTradeSetup = new Map();

    for (const snapshot of allSnapshots) {
      if (!mostRecentByTradeSetup.has(snapshot.tradeSetupId)) {
        // If we haven't seen this tradeSetupId yet, this is the most recent
        // (since snapshots are ordered by creation time desc)
        mostRecentByTradeSetup.set(snapshot.tradeSetupId, snapshot);
      }
    }

    // Convert map values back to array
    const mostRecentSnapshots = Array.from(mostRecentByTradeSetup.values());

    // Filter by status if provided
    if (status) {
      return mostRecentSnapshots.filter(
        (snapshot) => snapshot.status === status
      );
    }

    return mostRecentSnapshots;
  },
});

export const getPreviousSnapshot = query({
  args: {
    id: v.id("snapshots"),
  },
  handler: async (ctx, { id }) => {
    // First get the current snapshot to find its tradeSetupId and creation time
    const currentSnapshot = await ctx.db.get(id);
    if (!currentSnapshot) {
      return null;
    }

    // Find the previous snapshot in the same trade setup
    return await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", currentSnapshot.tradeSetupId)
      )
      .filter((q) =>
        q.lt(q.field("_creationTime"), currentSnapshot._creationTime)
      )
      .order("desc")
      .first();
  },
});

export const getPreviousStatuses = query({
  args: {
    tradeSetupId: v.optional(v.id("trade_setups")),
  },
  handler: async (ctx, { tradeSetupId }) => {
    if (!tradeSetupId) {
      return [];
    }

    // Get all snapshots for this trade setup, ordered by creation time
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", tradeSetupId)
      )
      .order("asc")
      .collect();

    // Extract statuses from snapshots
    return snapshots.map((snapshot) => snapshot.status);
  },
});

export const countSnapshotsWithTimeframe = query({
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

    // Count snapshots that include this timeframe
    const count = snapshots.filter((snapshot) =>
      snapshot.timeframes?.includes(timeframe)
    ).length;

    return count;
  },
});

export const hasSubsequentSnapshots = query({
  args: {
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, { snapshotId }) => {
    // Get the current snapshot to find its tradeSetupId and creation time
    const currentSnapshot = await ctx.db.get(snapshotId);
    if (!currentSnapshot) {
      return false;
    }

    // Check if there are any snapshots created after this one in the same trade setup
    const subsequentSnapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", currentSnapshot.tradeSetupId)
      )
      .filter((q) =>
        q.gt(q.field("_creationTime"), currentSnapshot._creationTime)
      )
      .first();

    return !!subsequentSnapshots;
  },
});
