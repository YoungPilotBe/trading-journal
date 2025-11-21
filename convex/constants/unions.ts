import { v } from "convex/values";

export const statusUnion = v.union(
  v.literal("idea"),
  v.literal("watching"),
  v.literal("executed"),
  v.literal("closed"),
  v.literal("reviewed"),
  v.literal("canceled")
);

export const sortBy = v.optional(
  v.union(v.literal("createdAt"), v.literal("updatedAt"))
);
export const sortOrder = v.optional(
  v.union(v.literal("asc"), v.literal("desc"))
);

export const resultUnion = v.union(
  v.literal("win"),
  v.literal("loss"),
  v.literal("breakeven")
);

export const emotionUnion = v.union(
  v.literal("fear"),
  v.literal("greed"),
  v.literal("impulsive"),
  v.literal("calm"),
  v.literal("revenge")
);

export const tpslSchema = v.optional(
  v.object({
    entryPrice: v.number(),
    takeProfits: v.array(
      v.object({
        price: v.number(),
        margin: v.number(),
        // Optional database fields for hybrid schema (present when updating existing entries)
        _id: v.optional(v.id("tpsl_entries")),
        snapshotId: v.optional(v.id("snapshots")),
        type: v.optional(
          v.union(v.literal("take_profit"), v.literal("stop_loss"))
        ),
        isHit: v.optional(v.boolean()),
        hitSnapshotId: v.optional(v.id("snapshots")),
        hitAt: v.optional(v.number()),
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
      })
    ),
    stopLosses: v.array(
      v.object({
        price: v.number(),
        margin: v.number(),
        // Optional database fields for hybrid schema (present when updating existing entries)
        _id: v.optional(v.id("tpsl_entries")),
        snapshotId: v.optional(v.id("snapshots")),
        type: v.optional(
          v.union(v.literal("take_profit"), v.literal("stop_loss"))
        ),
        isHit: v.optional(v.boolean()),
        hitSnapshotId: v.optional(v.id("snapshots")),
        hitAt: v.optional(v.number()),
        createdAt: v.optional(v.number()),
        updatedAt: v.optional(v.number()),
      })
    ),
  })
);
