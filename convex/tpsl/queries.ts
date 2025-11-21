import { v } from "convex/values";
import { query } from "../_generated/server";

export const getTpslEntriesBySnapshot = query({
  args: {
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, { snapshotId }) => {
    const entries = await ctx.db
      .query("tpsl_entries")
      .withIndex("by_snapshot", (q) => q.eq("snapshotId", snapshotId))
      .collect();

    return entries;
  },
});

export const getTpslEntriesByTradeSetup = query({
  args: {
    tradeSetupId: v.optional(v.id("trade_setups")),
  },
  handler: async (ctx, { tradeSetupId }) => {
    if (!tradeSetupId) return [];
    // Get all snapshots for this trade setup
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup", (q) => q.eq("tradeSetupId", tradeSetupId))
      .collect();

    // Get all TP/SL entries for these snapshots
    const allEntries = [];
    for (const snapshot of snapshots) {
      const entries = await ctx.db
        .query("tpsl_entries")
        .withIndex("by_snapshot", (q) => q.eq("snapshotId", snapshot._id))
        .collect();
      allEntries.push(...entries);
    }

    return allEntries;
  },
});
