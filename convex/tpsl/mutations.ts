import { ConvexError, v } from "convex/values";
import { api } from "../_generated/api";
import { mutation } from "../_generated/server";
import { tpslSchema } from "../constants/unions";

export const createTpslEntries = mutation({
  args: {
    snapshotId: v.id("snapshots"),
    tpsl: tpslSchema,
  },
  handler: async (ctx, { snapshotId, tpsl }) => {
    // Early return if tpsl is not provided
    if (!tpsl) {
      return;
    }

    const now = Date.now();

    // Process take profits - all entries have valid prices (schema ensures this)
    for (const entry of tpsl.takeProfits) {
      await ctx.db.insert("tpsl_entries", {
        snapshotId,
        type: "take_profit",
        price: entry.price,
        margin: entry.margin,
        isHit: false,
        hitSnapshotId: undefined,
        hitAt: undefined,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Process stop losses - all entries have valid prices (schema ensures this)
    for (const entry of tpsl.stopLosses) {
      await ctx.db.insert("tpsl_entries", {
        snapshotId,
        type: "stop_loss",
        price: entry.price,
        margin: entry.margin,
        isHit: false,
        hitSnapshotId: undefined,
        hitAt: undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const updateTpslEntry = mutation({
  args: {
    id: v.id("tpsl_entries"),
    price: v.number(),
    margin: v.number(),
  },
  handler: async (ctx, { id, price, margin }) => {
    // Get the existing entry to preserve hit tracking fields
    const existingEntry = await ctx.db.get(id);
    if (!existingEntry) {
      throw new Error(`TPSL entry with id ${id} not found`);
    }

    // Update only price, margin, and updatedAt
    // Preserve isHit, hitSnapshotId, hitAt, createdAt, snapshotId, type
    await ctx.db.patch(id, {
      price,
      margin,
      updatedAt: Date.now(),
    });
  },
});

export const upsertTpslEntries = mutation({
  args: {
    snapshotId: v.id("snapshots"),
    tpsl: tpslSchema,
  },
  handler: async (ctx, { snapshotId, tpsl }) => {
    // Early return if tpsl is not provided
    if (!tpsl) {
      return;
    }

    const now = Date.now();

    const tradeSetup = await ctx.runQuery(
      api.trade_setup.queries.getTradeSetupBySnapshotId,
      { snapshotId }
    );

    if (!tradeSetup) throw new ConvexError("No trade setup found");

    // Get all existing entries for this snapshot
    const existingEntries = await ctx.runQuery(
      api.tpsl.queries.getTpslEntriesByTradeSetup,
      { tradeSetupId: tradeSetup._id }
    );
    // Create sets of entry IDs from the submitted data
    const submittedEntryIds = new Set<string>();

    // Process take profits
    for (const entry of tpsl.takeProfits) {
      if (entry._id) {
        // Update existing entry
        submittedEntryIds.add(entry._id);
        const existingEntry = await ctx.db.get(entry._id);
        if (existingEntry) {
          // Preserve hit tracking fields when updating
          await ctx.db.patch(entry._id, {
            price: entry.price,
            margin: entry.margin,
            updatedAt: now,
            // Preserve: isHit, hitSnapshotId, hitAt, createdAt, snapshotId, type
          });
        }
      } else {
        // Create new entry
        await ctx.db.insert("tpsl_entries", {
          snapshotId,
          type: "take_profit",
          price: entry.price,
          margin: entry.margin,
          isHit: false,
          hitSnapshotId: undefined,
          hitAt: undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Process stop losses
    for (const entry of tpsl.stopLosses) {
      if (entry._id) {
        // Update existing entry
        submittedEntryIds.add(entry._id);
        const existingEntry = await ctx.db.get(entry._id);
        if (existingEntry) {
          // Preserve hit tracking fields when updating
          await ctx.db.patch(entry._id, {
            price: entry.price,
            margin: entry.margin,
            updatedAt: now,
            // Preserve: isHit, hitSnapshotId, hitAt, createdAt, snapshotId, type
          });
        }
      } else {
        // Create new entry
        await ctx.db.insert("tpsl_entries", {
          snapshotId,
          type: "stop_loss",
          price: entry.price,
          margin: entry.margin,
          isHit: false,
          hitSnapshotId: undefined,
          hitAt: undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Delete entries that exist in DB but aren't in the submitted array
    for (const existingEntry of existingEntries) {
      if (!submittedEntryIds.has(existingEntry._id)) {
        await ctx.db.delete(existingEntry._id);
      }
    }
  },
});
