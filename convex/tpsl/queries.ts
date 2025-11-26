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

export const getLatestTpslEntriesByTradeSetup = query({
  args: {
    tradeSetupId: v.id("trade_setups"),
  },
  handler: async (ctx, { tradeSetupId }) => {
    // Get the most recent snapshot for this trade setup
    const targetSnapshot = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", tradeSetupId)
      )
      .order("desc")
      .first();

    console.log(targetSnapshot);

    if (!targetSnapshot) {
      return { entries: [], entryPrice: undefined };
    }

    // Get TPSL entries from the target snapshot
    const entries = await ctx.db
      .query("tpsl_entries")
      .withIndex("by_snapshot", (q) => q.eq("snapshotId", targetSnapshot._id))
      .collect();

    // Get entry price from entry_price entry
    const entryPriceEntry = entries.find((e) => e.type === "entry_price");
    const entryPrice = entryPriceEntry?.price;

    return {
      entries,
      entryPrice,
    };
  },
});

export const getPreviousTpslEntriesBySnapshot = query({
  args: {
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, { snapshotId }) => {
    // Get the current snapshot to find its tradeSetupId and creation time
    const currentSnapshot = await ctx.db.get(snapshotId);
    if (!currentSnapshot) {
      return { entries: [], entryPrice: undefined };
    }

    // Find the previous snapshot in the same trade setup
    const targetSnapshot = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", currentSnapshot.tradeSetupId)
      )
      .filter((q) =>
        q.lt(q.field("_creationTime"), currentSnapshot._creationTime)
      )
      .order("desc")
      .first();

    if (!targetSnapshot) {
      return { entries: [], entryPrice: undefined };
    }

    // Get TPSL entries from the target snapshot
    const entries = await ctx.db
      .query("tpsl_entries")
      .withIndex("by_snapshot", (q) => q.eq("snapshotId", targetSnapshot._id))
      .collect();

    // Get entry price from entry_price entry
    const entryPriceEntry = entries.find((e) => e.type === "entry_price");
    const entryPrice = entryPriceEntry?.price;

    return {
      entries,
      entryPrice,
    };
  },
});

/**
 * Get entry price from tpsl_entries for a specific snapshot
 */
export const getEntryPriceBySnapshot = query({
  args: {
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, { snapshotId }) => {
    const entries = await ctx.db
      .query("tpsl_entries")
      .withIndex("by_snapshot", (q) => q.eq("snapshotId", snapshotId))
      .filter((q) => q.eq(q.field("type"), "entry_price"))
      .collect();

    // Return the entry price from the entry_price entry (should be only one)
    return entries.length > 0 ? entries[0].price : undefined;
  },
});
