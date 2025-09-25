import { v } from "convex/values";
import { api } from "../_generated/api";
import { Doc } from "../_generated/dataModel";
import { internalQuery } from "../_generated/server";

// Types for orchestration
export type TradeSetupWithSnapshots = Doc<"trade_setups"> & {
  snapshots: Doc<"snapshots">[];
};

export const getTradeSetupWithSnapshots = internalQuery({
  args: {
    tradeSetupId: v.id("trade_setups"),
  },
  handler: async (ctx, args): Promise<TradeSetupWithSnapshots | null> => {
    const tradeSetup = await ctx.runQuery(
      api.trade_setup.queries.getTradeSetup,
      { id: args.tradeSetupId }
    );
    if (!tradeSetup) return null;

    const snapshots = await ctx.runQuery(
      api.snaphot.queries.getSnapshotByTradeSetup,
      { tradeSetupId: tradeSetup._id }
    );

    return {
      ...tradeSetup,
      snapshots,
    } as TradeSetupWithSnapshots;
  },
});

/**
 * Fetch trade setup with all its snapshots
 */
// export async function getTradeSetupWithSnapshots(
//   db: DatabaseReader,
//   tradeSetupId: Id<"trade_setups">
// ): Promise<TradeSetupWithSnapshots | null> {
//   const tradeSetup = await db.get(tradeSetupId);
//   if (!tradeSetup) return null;

//   const snapshots = await db
//     .query("snapshots")
//     .withIndex("by_trade_setup", (q) => q.eq("tradeSetupId", tradeSetupId))
//     .order("asc")
//     .collect();

//   return {
//     ...tradeSetup,
//     snapshots,
//   };
// }

/**
 * Create a filtered trade setup with only snapshots of a specific status
 */
export function filterTradeSetupByStatus(
  tradeSetup: TradeSetupWithSnapshots,
  status: string
): TradeSetupWithSnapshots | null {
  const filteredSnapshots = tradeSetup.snapshots.filter(
    (snapshot) => snapshot.status === status
  );

  // If no snapshots with the specified status, return null
  if (filteredSnapshots.length === 0) {
    return null;
  }

  return {
    ...tradeSetup,
    snapshots: filteredSnapshots,
  };
}

export const getAllTradeSetupsWithSnapshots = internalQuery({
  args: {
    excludeId: v.id("trade_setups"),
  },
  handler: async (ctx, args): Promise<TradeSetupWithSnapshots[]> => {
    const allTradeSetups = await ctx.db
      .query("trade_setups")
      .filter((q) => q.neq(q.field("_id"), args.excludeId))
      .collect();

    const tradeSetupsWithSnapshots: TradeSetupWithSnapshots[] = [];

    for (const tradeSetup of allTradeSetups) {
      const snapshots = await ctx.runQuery(
        api.snaphot.queries.getSnapshotByTradeSetup,
        { tradeSetupId: tradeSetup._id }
      );

      tradeSetupsWithSnapshots.push({
        ...tradeSetup,
        snapshots,
      } as TradeSetupWithSnapshots);
    }

    return tradeSetupsWithSnapshots;
  },
});
