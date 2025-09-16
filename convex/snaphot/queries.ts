import { v } from "convex/values";
import { query } from "../_generated/server";
import { statusUnion } from "../constants/unions";

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
