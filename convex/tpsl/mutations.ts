import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createTpslEntries = mutation({
  args: {
    snapshotId: v.id("snapshots"),
    tpsl: v.object({
      takeProfits: v.array(
        v.object({
          price: v.optional(v.number()),
          margin: v.number(),
          isHit: v.optional(v.boolean()),
        })
      ),
      stopLosses: v.array(
        v.object({
          price: v.optional(v.number()),
          margin: v.number(),
          isHit: v.optional(v.boolean()),
        })
      ),
    }),
  },
  handler: async (ctx, { snapshotId, tpsl }) => {
    const now = Date.now();

    // Process take profits - only entries with valid prices
    for (const entry of tpsl.takeProfits) {
      if (entry.price !== undefined && entry.price > 0) {
        await ctx.db.insert("tpsl_entries", {
          snapshotId,
          type: "take_profit",
          price: entry.price,
          margin: entry.margin,
          isHit: entry.isHit ?? false,
          hitSnapshotId: entry.isHit ? snapshotId : undefined,
          hitAt: entry.isHit ? now : undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Process stop losses - only entries with valid prices
    for (const entry of tpsl.stopLosses) {
      if (entry.price !== undefined && entry.price > 0) {
        await ctx.db.insert("tpsl_entries", {
          snapshotId,
          type: "stop_loss",
          price: entry.price,
          margin: entry.margin,
          isHit: entry.isHit ?? false,
          hitSnapshotId: entry.isHit ? snapshotId : undefined,
          hitAt: entry.isHit ? now : undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  },
});
