import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id, Doc } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { tpslSchema } from "../constants/unions";
import { getCurrentRMultiple } from "../charts/progression/services";

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

    // Process entry price - create entry_price entry instead of patching snapshot
    if (tpsl.entryPrice !== undefined) {
      // Delete existing entry_price entries for this snapshot (except hit ones)
      const existingEntryPriceEntries = existingEntries.filter(
        (e) => e.type === "entry_price"
      );
      for (const existingEntryPrice of existingEntryPriceEntries) {
        if (!existingEntryPrice.isHit) {
          await ctx.db.delete(existingEntryPrice._id);
        }
      }

      // Create entry_price entry
      await ctx.db.insert("tpsl_entries", {
        snapshotId,
        type: "entry_price",
        price: tpsl.entryPrice,
        margin: 100, // Entry price always has 100% margin
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

    // Get all existing entries for this snapshot (not trade setup)
    const existingEntries = await ctx.runQuery(
      api.tpsl.queries.getTpslEntriesBySnapshot,
      { snapshotId }
    );

    // Create a map of existing entries by their _id for quick lookup
    const existingEntriesMap = new Map(
      existingEntries.map((entry) => [entry._id, entry])
    );

    // Track which entry IDs we're keeping (updating or creating)
    const keptEntryIds = new Set<Id<"tpsl_entries">>();

    // Track snapshots that need R-Multiple recalculation (where entries were newly hit)
    const snapshotsToUpdateRMultiple = new Set<Id<"snapshots">>();

    // Check if this is the most recent snapshot (allows modification of hit entry_price)
    const currentSnapshot = await ctx.db.get(snapshotId);
    if (!currentSnapshot) {
      return;
    }
    const allSnapshotsForTradeSetup = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", currentSnapshot.tradeSetupId)
      )
      .order("desc")
      .collect();
    const isMostRecentSnapshot =
      allSnapshotsForTradeSetup.length > 0 &&
      allSnapshotsForTradeSetup[0]._id === snapshotId;

    // Helper function to process an entry (update if exists, create if not)
    const processEntry = async (
      entry: {
        price: number;
        margin: number;
        _id?: Id<"tpsl_entries">;
        isHit?: boolean;
        hitSnapshotId?: Id<"snapshots">;
        hitAt?: number;
        createdAt?: number;
      },
      type: "take_profit" | "stop_loss" | "entry_price"
    ) => {
      const entryIsHit = entry.isHit ?? false;
      const hitSnapshotIdForEntry =
        entry.hitSnapshotId ?? (entryIsHit ? snapshotId : undefined);

      // Check if this entry is newly being marked as hit
      let isNewlyHit = false;
      if (entry._id) {
        const existingEntry = existingEntriesMap.get(entry._id);
        if (existingEntry) {
          // Entry exists - check if it's being newly marked as hit
          isNewlyHit = entryIsHit && !existingEntry.isHit;
        } else {
          // Entry doesn't exist yet - if it's being created as hit, it's newly hit
          isNewlyHit = entryIsHit;
        }
      } else {
        // New entry being created as hit
        isNewlyHit = entryIsHit;
      }

      // Track snapshot for R-Multiple calculation if entry is newly hit
      if (isNewlyHit && hitSnapshotIdForEntry) {
        snapshotsToUpdateRMultiple.add(hitSnapshotIdForEntry);
      }

      // If entry has an _id, try to update it
      if (entry._id) {
        const existingEntry = existingEntriesMap.get(entry._id);
        if (existingEntry) {
          // For entry_price entries: allow modification if it's hit but this is the most recent snapshot
          if (
            type === "entry_price" &&
            existingEntry.isHit &&
            !isMostRecentSnapshot
          ) {
            // Cannot modify hit entry_price if not most recent snapshot
            return;
          }

          // Entry exists, update it while preserving hit tracking fields
          keptEntryIds.add(entry._id);

          // Prepare update object
          const updateData: {
            price: number;
            margin: number;
            updatedAt: number;
            isHit?: boolean;
            hitSnapshotId?: Id<"snapshots">;
            hitAt?: number;
          } = {
            price: entry.price,
            margin: entry.margin,
            updatedAt: now,
          };

          // For entry_price, always use margin 100
          if (type === "entry_price") {
            updateData.margin = 100;
          }

          // If entry is newly being marked as hit, update hit tracking fields
          // Otherwise, preserve existing hit tracking fields (never overwrite if already hit)
          if (isNewlyHit) {
            updateData.isHit = true;
            updateData.hitSnapshotId = hitSnapshotIdForEntry;
            updateData.hitAt = entry.hitAt ?? now;
          }

          await ctx.db.patch(entry._id, updateData);
          return;
        }
      }

      // Entry doesn't have _id or doesn't exist, create a new one
      // For entry_price, ensure margin is 100
      const margin = type === "entry_price" ? 100 : entry.margin;
      await ctx.db.insert("tpsl_entries", {
        snapshotId,
        type,
        price: entry.price,
        margin,
        isHit: entryIsHit,
        hitSnapshotId: hitSnapshotIdForEntry,
        hitAt: entry.hitAt ?? (entryIsHit ? now : undefined),
        createdAt: entry.createdAt ?? now,
        updatedAt: now,
      });
    };

    // Process take profits
    for (const entry of tpsl.takeProfits) {
      await processEntry(entry, "take_profit");
    }

    // Process stop losses
    for (const entry of tpsl.stopLosses) {
      await processEntry(entry, "stop_loss");
    }

    // Process entry price - create/update entry_price entry
    if (tpsl.entryPrice !== undefined) {
      // Find existing entry_price entry for this snapshot
      const existingEntryPriceEntry = existingEntries.find(
        (e) => e.type === "entry_price"
      );

      if (existingEntryPriceEntry) {
        // Update existing entry_price entry
        // Allow modification if it's hit but this is the most recent snapshot
        if (
          existingEntryPriceEntry.isHit &&
          !isMostRecentSnapshot
        ) {
          // Cannot modify hit entry_price if not most recent snapshot
        } else {
          await processEntry(
            {
              price: tpsl.entryPrice,
              margin: 100,
              _id: existingEntryPriceEntry._id,
              isHit: existingEntryPriceEntry.isHit,
              hitSnapshotId: existingEntryPriceEntry.hitSnapshotId,
              hitAt: existingEntryPriceEntry.hitAt,
              createdAt: existingEntryPriceEntry.createdAt,
            },
            "entry_price"
          );
        }
      } else {
        // Create new entry_price entry
        await processEntry(
          {
            price: tpsl.entryPrice,
            margin: 100,
          },
          "entry_price"
        );
      }
    }

    // Delete existing entries that are not in the new tpsl data (except hit ones)
    // Hit entries cannot be removed, and entries we updated/created are already kept
    // For entry_price: delete if not hit or if it's the most recent snapshot
    for (const existingEntry of existingEntries) {
      if (
        existingEntry.type === "entry_price" &&
        existingEntry.isHit &&
        !isMostRecentSnapshot
      ) {
        // Keep hit entry_price if not most recent snapshot
        continue;
      }
      if (!existingEntry.isHit && !keptEntryIds.has(existingEntry._id)) {
        await ctx.db.delete(existingEntry._id);
      }
    }

    // Calculate and update R-Multiple for snapshots where entries were newly hit
    if (snapshotsToUpdateRMultiple.size > 0) {
      // Get the current snapshot to find the trade setup
      const currentSnapshot = await ctx.db.get(snapshotId);
      if (!currentSnapshot) {
        return;
      }

      const tradeSetupId = currentSnapshot.tradeSetupId;

      // Get the trade setup to get the direction
      const tradeSetup = await ctx.db.get(tradeSetupId);
      if (!tradeSetup || !tradeSetup.direction) {
        return;
      }

      const direction = tradeSetup.direction;

      // Process each snapshot that needs R-Multiple update
      for (const hitSnapshotId of snapshotsToUpdateRMultiple) {
        // Fetch all snapshots for this trade setup up to and including the hit snapshot
        const allSnapshots = await ctx.db
          .query("snapshots")
          .withIndex("by_trade_setup_and_created_at", (q) =>
            q.eq("tradeSetupId", tradeSetupId)
          )
          .order("asc")
          .collect();

        // Filter to snapshots up to and including the hit snapshot
        const hitSnapshot = await ctx.db.get(hitSnapshotId);
        if (!hitSnapshot) {
          continue;
        }

        const snapshotsUpToHit = allSnapshots.filter(
          (s) => s._creationTime <= hitSnapshot._creationTime
        );

        // Fetch TP/SL entries for each snapshot and transform to SnapshotWithTpsl format
        const snapshotsWithTpsl = await Promise.all(
          snapshotsUpToHit.map(async (snapshot: Doc<"snapshots">, index: number) => {
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

        // Calculate R-Multiple for the hit snapshot
        const rMultiple = getCurrentRMultiple(
          snapshotsWithTpsl,
          direction,
          hitSnapshotId
        );

        // Update the snapshot's rMultiple field
        if (rMultiple !== null) {
          await ctx.db.patch(hitSnapshotId, {
            rMultiple: rMultiple,
          });
        }
      }
    }
  },
});
