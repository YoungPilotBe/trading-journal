import { v } from "convex/values";
import { query } from "../_generated/server";

// Placeholder query for loading TP/SL entries by snapshot
// This will be implemented later when we need to load TP/SL data back into the dialog
export const getTpslEntriesBySnapshot = query({
  args: {
    snapshotId: v.id("snapshots"),
  },
  returns: v.array(
    v.object({
      _id: v.id("tpsl_entries"),
      snapshotId: v.id("snapshots"),
      type: v.union(v.literal("take_profit"), v.literal("stop_loss")),
      price: v.number(),
      margin: v.number(),
      isHit: v.boolean(),
      hitSnapshotId: v.optional(v.id("snapshots")),
      hitAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, { snapshotId }) => {
    const entries = await ctx.db
      .query("tpsl_entries")
      .withIndex("by_snapshot", (q) => q.eq("snapshotId", snapshotId))
      .collect();

    return entries;
  },
});

