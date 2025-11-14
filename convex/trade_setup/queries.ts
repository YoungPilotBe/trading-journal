import { v } from "convex/values";
import { query } from "../_generated/server";
import { sortBy, sortOrder, statusUnion } from "../constants/unions";

// Get a single trade setup by ID
export const getTradeSetup = query({
  args: { id: v.id("trade_setups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get all timeframes aggregated from all snapshots for a trade setup
export const getTradeSetupTimeframes = query({
  args: { tradeSetupId: v.id("trade_setups") },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", args.tradeSetupId)
      )
      .collect();

    // Aggregate unique timeframes from all snapshots
    const allTimeframes = snapshots.flatMap((s) => s.timeframes || []);
    const uniqueTimeframes = [...new Set(allTimeframes)];

    return uniqueTimeframes;
  },
});

export const getTradeSetupBySnapshotId = query({
  args: { snapshotId: v.id("snapshots") },
  handler: async (ctx, args) => {
    // First get the snapshot to find the trade setup ID
    const snapshot = await ctx.db.get(args.snapshotId);
    if (!snapshot) {
      return null;
    }

    // Then get the trade setup using the trade setup ID from the snapshot
    return await ctx.db.get(snapshot.tradeSetupId);
  },
});

// Get unique assets for filtering
export const getUniqueAssets = query({
  args: {},
  handler: async (ctx) => {
    const allSetups = await ctx.db.query("trade_setups").collect();
    const uniqueAssets = [...new Set(allSetups.map((setup) => setup.asset))];

    return uniqueAssets.sort();
  },
});

// Get all trade setups with optional filtering and sorting
export const getTradeSetups = query({
  args: {
    asset: v.optional(v.string()),
    direction: v.optional(v.union(v.literal("long"), v.literal("short"))),
    limit: v.optional(v.number()),
    sortBy,
    sortOrder,
  },
  handler: async (ctx, { asset, direction, limit, sortBy, sortOrder }) => {
    const convexSortBy = sortBy || "createdAt";
    const convexSortOrder = sortOrder || "desc";

    let query = ctx.db
      .query("trade_setups")
      .withIndex(
        convexSortBy === "createdAt" ? "by_created_at" : "by_updated_at"
      )
      .order(convexSortOrder);

    if (asset) query = query.filter((q) => q.eq(q.field("asset"), asset));
    if (direction)
      query = query.filter((q) => q.eq(q.field("direction"), direction));

    return limit ? await query.take(limit) : await query.collect();
  },
});

// Get trading journal data with date ranges and snapshot counts
export const getTradingJournalData = query({
  args: {
    asset: v.optional(v.string()),
    direction: v.optional(v.union(v.literal("long"), v.literal("short"))),
    status: v.optional(v.array(statusUnion)),
    limit: v.optional(v.number()),
    sortBy,
    sortOrder,
  },
  handler: async (
    ctx,
    { asset, direction, limit, sortBy, sortOrder, status }
  ) => {
    const convexSortBy = sortBy || "createdAt";
    const convexSortOrder = sortOrder || "desc";

    let query = ctx.db
      .query("trade_setups")
      .withIndex(
        convexSortBy === "createdAt" ? "by_created_at" : "by_updated_at"
      )
      .order(convexSortOrder);

    if (asset) query = query.filter((q) => q.eq(q.field("asset"), asset));
    if (direction)
      query = query.filter((q) => q.eq(q.field("direction"), direction));

    const tradeSetups = limit ? await query.take(limit) : await query.collect();

    // For each trade setup, get all its snapshots to calculate date range
    const journalData = await Promise.all(
      tradeSetups.map(async (tradeSetup) => {
        const snapshots = await ctx.db
          .query("snapshots")
          .withIndex("by_trade_setup_and_created_at", (q) =>
            q.eq("tradeSetupId", tradeSetup._id)
          )
          .order("asc")
          .collect();

        const firstSnapshot = snapshots[0];
        const lastSnapshot = snapshots[snapshots.length - 1];

        // Aggregate unique timeframes from all snapshots
        const allTimeframes = snapshots.flatMap((s) => s.timeframes || []);
        const uniqueTimeframes = [...new Set(allTimeframes)];

        return {
          id: tradeSetup._id,
          asset: tradeSetup.asset,
          result: tradeSetup.result,
          direction: tradeSetup.direction,
          title: tradeSetup.title,
          riskReward: lastSnapshot?.riskReward ?? null,
          timeframes: uniqueTimeframes,
          createdAt: tradeSetup.createdAt,
          updatedAt: tradeSetup.updatedAt,
          snapshotCount: snapshots.length,
          dateRange: {
            start: firstSnapshot?.createdAt || tradeSetup.createdAt,
            end: lastSnapshot?.createdAt || tradeSetup.createdAt,
          },
          latestStatus: lastSnapshot?.status || "idea",
          latestSnapshotId: lastSnapshot?._id || firstSnapshot?._id,
        };
      })
    );

    // Filter by latest snapshot status if status filter is provided
    const filteredData = status
      ? journalData.filter((data) => status.includes(data.latestStatus))
      : journalData;

    return filteredData;
  },
});

// // Get all images associated with a trade setup
// export const getTradeSetupImages = query({
//   args: { tradeSetupId: v.id("trade_setups") },
//   handler: async (ctx, { tradeSetupId }) => {
//     return await ctx.db
//       .query("tradingview_images")
//       .withIndex("by_trade_setup", (q) => q.eq("tradeSetupId", tradeSetupId))
//       .collect();
//   },
// });
