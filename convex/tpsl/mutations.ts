import { ConvexError, v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
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

    // Get all existing entries for this snapshot
    const existingEntries = await ctx.runQuery(
      api.tpsl.queries.getTpslEntriesBySnapshot,
      { snapshotId }
    );

    // Delete existing entries for this snapshot (except hit ones)
    // Hit entries cannot be removed
    for (const existingEntry of existingEntries) {
      if (!existingEntry.isHit) {
        await ctx.db.delete(existingEntry._id);
      }
    }

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

    // Update snapshot with entry price
    await ctx.db.patch(snapshotId, {
      entryPrice: tpsl.entryPrice,
    });
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

    // Get all existing entries for this snapshot (not trade setup)
    const existingEntries = await ctx.runQuery(
      api.tpsl.queries.getTpslEntriesBySnapshot,
      { snapshotId }
    );

    // Delete existing entries for this snapshot (except hit ones)
    // Hit entries cannot be removed
    for (const existingEntry of existingEntries) {
      if (!existingEntry.isHit) {
        await ctx.db.delete(existingEntry._id);
      }
    }

    // Always create new entries for the current snapshot
    // Process take profits
    for (const entry of tpsl.takeProfits) {
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

    // Process stop losses
    for (const entry of tpsl.stopLosses) {
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

    // Update snapshot with entry price
    await ctx.db.patch(snapshotId, {
      entryPrice: tpsl.entryPrice,
    });
  },
});
