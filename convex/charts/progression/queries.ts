import { v } from "convex/values";
import { api } from "../../_generated/api";
import { Doc, Id } from "../../_generated/dataModel";
import { query } from "../../_generated/server";
import { EVOLUTION_CHART_COLORS } from "../constants";
import { getCurrentRMultiple } from "./services";

/**
 * Type for a TP/SL entry in the progression chart response
 */
type ProgressionTpslEntry = {
  id: Id<"tpsl_entries">;
  type: "take_profit" | "stop_loss";
  price: number;
  margin: number;
  isHit: boolean;
  hitSnapshotId: Id<"snapshots"> | undefined;
  hitAt: number | undefined;
};

/**
 * Type for a snapshot with TP/SL entries in the progression chart response
 */
type ProgressionSnapshotData = {
  snapshotId: Id<"snapshots">;
  index: number;
  entryPrice: number | undefined;
  tpslEntries: ProgressionTpslEntry[];
  createdAt: number;
};

/**
 * Return type for getProgressionChart query
 */
type ProgressionChartResponse = {
  data: ProgressionSnapshotData[];
  chartConfig: {
    type: "line";
    xAxis: "x";
    yAxis: "y";
  };
  chartColors: typeof EVOLUTION_CHART_COLORS;
  direction: "long" | "short";
  currentSnapshotId: Id<"snapshots"> | undefined;
};

/**
 * Get progression chart data for a specific trade setup and snapshot
 * Returns snapshots with their TP/SL entries for client-side calculation
 * The currentSnapshotId determines which snapshot's TP/SL entries are the "possibilities"
 */
export const getProgressionChart = query({
  args: {
    tradeSetupId: v.id("trade_setups"),
    currentSnapshotId: v.optional(v.id("snapshots")),
  },
  handler: async (
    ctx,
    { tradeSetupId, currentSnapshotId }
  ): Promise<ProgressionChartResponse> => {
    // Fetch the trade setup to get the direction
    const tradeSetup = await ctx.db.get(tradeSetupId);
    if (!tradeSetup || !tradeSetup.direction) {
      return {
        data: [],
        chartConfig: {
          type: "line",
          xAxis: "x",
          yAxis: "y",
        },
        chartColors: EVOLUTION_CHART_COLORS,
        direction: "long", // Default fallback
        currentSnapshotId: undefined,
      };
    }

    const direction = tradeSetup.direction;

    // Fetch all snapshots for this trade setup, ordered by creation time
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", tradeSetupId)
      )
      .order("asc") // Oldest first
      .collect();

    // Fetch TP/SL entries for each snapshot
    const snapshotsWithTpsl: ProgressionSnapshotData[] = await Promise.all(
      snapshots.map(async (snapshot: Doc<"snapshots">, index: number) => {
        const tpslEntries: Doc<"tpsl_entries">[] = await ctx.runQuery(
          api.tpsl.queries.getTpslEntriesBySnapshot,
          { snapshotId: snapshot._id }
        );

        // Extract entry price from entry_price entry
        const entryPriceEntry = tpslEntries.find(
          (e) => e.type === "entry_price"
        );
        const entryPrice = entryPriceEntry?.price;

        // Filter out entry_price entries from tpslEntries (only include TP/SL)
        const tpSlEntries = tpslEntries.filter(
          (e) => e.type !== "entry_price"
        );

        return {
          snapshotId: snapshot._id,
          index,
          entryPrice,
          tpslEntries: tpSlEntries.map(
            (entry: Doc<"tpsl_entries">): ProgressionTpslEntry => ({
              id: entry._id,
              type: entry.type as "take_profit" | "stop_loss",
              price: entry.price,
              margin: entry.margin,
              isHit: entry.isHit,
              hitSnapshotId: entry.hitSnapshotId,
              hitAt: entry.hitAt,
            })
          ),
          createdAt: snapshot.createdAt,
        };
      })
    );

    return {
      data: snapshotsWithTpsl,
      chartConfig: {
        type: "line",
        xAxis: "x",
        yAxis: "y",
      },
      chartColors: EVOLUTION_CHART_COLORS,
      direction,
      currentSnapshotId,
    };
  },
});

/**
 * Get current R-multiple value for a specific trade setup and snapshot
 * Returns the calculated R-multiple based on hit TP/SL entries
 * The currentSnapshotId determines which snapshot to calculate up to (defaults to latest)
 */
export const getCurrentRMultipleQuery = query({
  args: {
    tradeSetupId: v.id("trade_setups"),
    currentSnapshotId: v.optional(v.id("snapshots")),
  },
  handler: async (
    ctx,
    { tradeSetupId, currentSnapshotId }
  ): Promise<{ currentRMultiple: number | null }> => {
    // Fetch the trade setup to get the direction
    const tradeSetup = await ctx.db.get(tradeSetupId);
    if (!tradeSetup || !tradeSetup.direction) {
      return {
        currentRMultiple: null,
      };
    }

    const direction = tradeSetup.direction;

    // Fetch all snapshots for this trade setup, ordered by creation time
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", tradeSetupId)
      )
      .order("asc") // Oldest first
      .collect();

    // If no snapshots, return null
    if (snapshots.length === 0) {
      return {
        currentRMultiple: null,
      };
    }

    // Fetch TP/SL entries for each snapshot and transform to SnapshotWithTpsl format
    const snapshotsWithTpsl = await Promise.all(
      snapshots.map(async (snapshot: Doc<"snapshots">, index: number) => {
        const tpslEntries: Doc<"tpsl_entries">[] = await ctx.runQuery(
          api.tpsl.queries.getTpslEntriesBySnapshot,
          { snapshotId: snapshot._id }
        );

        // Extract entry price from entry_price entry
        const entryPriceEntry = tpslEntries.find(
          (e) => e.type === "entry_price"
        );
        const entryPrice = entryPriceEntry?.price;

        // Filter out entry_price entries from tpslEntries (only include TP/SL)
        const tpSlEntries = tpslEntries.filter(
          (e) => e.type !== "entry_price"
        );

        return {
          snapshotId: snapshot._id,
          index,
          entryPrice,
          tpslEntries: tpSlEntries.map((entry: Doc<"tpsl_entries">) => ({
            id: entry._id,
            type: entry.type as "take_profit" | "stop_loss",
            price: entry.price,
            margin: entry.margin,
            isHit: entry.isHit,
            hitSnapshotId: entry.hitSnapshotId,
            hitAt: entry.hitAt,
          })),
          createdAt: snapshot.createdAt,
        };
      })
    );

    // Calculate current R-multiple using the service function
    const currentRMultiple = getCurrentRMultiple(
      snapshotsWithTpsl,
      direction,
      currentSnapshotId
    );

    return {
      currentRMultiple,
    };
  },
});
