import { ConvexError, v } from "convex/values";
import { api, internal } from "../_generated/api";
import { Doc } from "../_generated/dataModel";
import { query } from "../_generated/server";

export const getNote = query({
  args: {
    id: v.id("notes"),
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

// Keep the old queries for backward compatibility
export const getNotesSnapshot = query({
  args: {
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, { snapshotId }) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_snapshot", (q) => q.eq("snapshotId", snapshotId))
      .collect();
  },
});

export const getNotesTradeSetup = query({
  args: {
    snapshotId: v.optional(v.id("snapshots")),
    tradeSetupId: v.optional(v.id("trade_setups")),
  },
  handler: async (
    ctx,
    { snapshotId, tradeSetupId }
  ): Promise<Doc<"notes">[]> => {
    // Ensure at least one ID is provided
    if (!snapshotId && !tradeSetupId) {
      throw new ConvexError(
        "Either snapshotId or tradeSetupId must be provided"
      );
    }

    if (snapshotId) {
      const tradeSetup = await ctx.runQuery(
        api.trade_setup.queries.getTradeSetupBySnapshotId,
        { snapshotId }
      );

      if (!tradeSetup) throw new ConvexError("No trade setup found");
      const snapshots = await ctx.runQuery(
        api.snaphot.queries.getSnapshotByTradeSetup,
        { tradeSetupId: tradeSetup._id }
      );

      const snapshotIds = snapshots.map((snapshot) => snapshot._id);
      return await ctx.runQuery(
        internal.notes.internal.collectAllNotesFromSnapshots,
        { snapshotIds }
      );
    }

    if (tradeSetupId) {
      const snapshots = await ctx.runQuery(
        api.snaphot.queries.getSnapshotByTradeSetup,
        { tradeSetupId }
      );
      const snapshotIds = snapshots.map((snapshot) => snapshot._id);
      return await ctx.runQuery(
        internal.notes.internal.collectAllNotesFromSnapshots,
        { snapshotIds }
      );
    }

    return [];
  },
});
