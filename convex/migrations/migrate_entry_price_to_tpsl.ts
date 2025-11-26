import { internalMutation } from "../_generated/server";

/**
 * Migration script to move entryPrice from snapshots to tpsl_entries
 * Creates entry_price type entries for all snapshots that have entryPrice set
 * Marks them as hit since they're already active
 * Removes entryPrice from snapshots
 */
export const migrateEntryPriceToTpsl = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Query all snapshots with entryPrice set
    const snapshots = await ctx.db
      .query("snapshots")
      .filter((q) => q.neq(q.field("entryPrice"), undefined))
      .collect();

    console.log(
      `Found ${snapshots.length} snapshots with entryPrice to migrate`
    );

    let migratedCount = 0;
    let skippedCount = 0;

    for (const snapshot of snapshots) {
      // Skip if entryPrice is not set
      if (snapshot.entryPrice === undefined) {
        skippedCount++;
        continue;
      }

      // Check if an entry_price entry already exists for this snapshot
      const existingEntryPriceEntries = await ctx.db
        .query("tpsl_entries")
        .withIndex("by_snapshot", (q) => q.eq("snapshotId", snapshot._id))
        .filter((q) => q.eq(q.field("type"), "entry_price"))
        .collect();

      // Skip if entry_price already exists (idempotent migration)
      if (existingEntryPriceEntries.length > 0) {
        console.log(
          `Skipping snapshot ${snapshot._id} - entry_price already exists`
        );
        skippedCount++;
        // Still remove entryPrice from snapshot if it exists
        await ctx.db.patch(snapshot._id, {
          entryPrice: undefined,
        });
        continue;
      }

      // Create entry_price entry
      await ctx.db.insert("tpsl_entries", {
        snapshotId: snapshot._id,
        type: "entry_price",
        price: snapshot.entryPrice,
        margin: 100, // Entry price always has 100% margin
        isHit: true, // Mark as hit since existing entry prices are already "active"
        hitSnapshotId: snapshot._id, // Mark as hit at the snapshot where it was set
        hitAt: snapshot.createdAt, // Use snapshot creation time
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.createdAt,
      });

      // Remove entryPrice from snapshot
      await ctx.db.patch(snapshot._id, {
        entryPrice: undefined,
      });

      migratedCount++;
    }

    console.log(
      `Migration complete: ${migratedCount} migrated, ${skippedCount} skipped`
    );

    return {
      migrated: migratedCount,
      skipped: skippedCount,
      total: snapshots.length,
    };
  },
});
