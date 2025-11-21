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
          // Build update fields from provided entry data
          const updateFields: {
            updatedAt: number;
            price: number;
            margin: number;
            isHit?: boolean;
            hitSnapshotId?: Id<"snapshots">;
            hitAt?: number;
          } = {
            price: entry.price,
            margin: entry.margin,
            updatedAt: now,
          };

          // Handle isHit: prevent unhitting (once hit, cannot unhit)
          // If entry is already hit in DB, don't allow unhitting
          if (existingEntry.isHit && !entry.isHit) {
            // Don't update isHit - keep it as true
            updateFields.isHit = existingEntry.isHit;
          } else {
            // Allow setting to true or updating from false to true
            updateFields.isHit = entry.isHit;
            // If setting to true and hitSnapshotId/hitAt not set, set them
            if (entry.isHit && !existingEntry.hitSnapshotId) {
              updateFields.hitSnapshotId = snapshotId;
              updateFields.hitAt = now;
            }
          }

          await ctx.db.patch(entry._id, updateFields);
        }
      } else {
        // Create new entry
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

    // Process stop losses
    for (const entry of tpsl.stopLosses) {
      if (entry._id) {
        // Update existing entry
        submittedEntryIds.add(entry._id);
        const existingEntry = await ctx.db.get(entry._id);
        if (existingEntry) {
          // Build update fields from provided entry data
          const updateFields: {
            updatedAt: number;
            price: number;
            margin: number;
            isHit?: boolean;
            hitSnapshotId?: Id<"snapshots">;
            hitAt?: number;
          } = {
            price: entry.price,
            margin: entry.margin,
            updatedAt: now,
          };

          // Handle isHit: prevent unhitting (once hit, cannot unhit)
          // If entry is already hit in DB, don't allow unhitting
          if (existingEntry.isHit && !entry.isHit) {
            // Don't update isHit - keep it as true
            updateFields.isHit = existingEntry.isHit;
          } else {
            // Allow setting to true or updating from false to true
            updateFields.isHit = entry.isHit;
            // If setting to true and hitSnapshotId/hitAt not set, set them
            if (entry.isHit && !existingEntry.hitSnapshotId) {
              updateFields.hitSnapshotId = snapshotId;
              updateFields.hitAt = now;
            }
          }

          await ctx.db.patch(entry._id, updateFields);
        }
      } else {
        // Create new entry
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

    // Delete entries that exist in DB but aren't in the submitted array
    // Never delete entries that are hit (isHit = true)
    for (const existingEntry of existingEntries) {
      if (!submittedEntryIds.has(existingEntry._id)) {
        // Prevent deletion of hit entries
        if (existingEntry.isHit) {
          continue;
        }
        await ctx.db.delete(existingEntry._id);
      }
    }

    // Update snapshot with entry price
    await ctx.db.patch(snapshotId, {
      entryPrice: tpsl.entryPrice,
    });
  },
});
