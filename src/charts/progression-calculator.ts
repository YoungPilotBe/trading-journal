import type { Id } from "../../convex/_generated/dataModel";
import type { ProgressionChartData } from "./chart.types";

type TpslEntry = {
  id: Id<"tpsl_entries">;
  type: "take_profit" | "stop_loss";
  price: number;
  margin: number;
  isHit: boolean;
  hitSnapshotId?: Id<"snapshots">;
  hitAt?: number;
};

type SnapshotWithTpsl = {
  snapshotId: Id<"snapshots">;
  index: number;
  entryPrice?: number;
  tpslEntries: TpslEntry[];
  createdAt: number;
};

type ReferencePoint = {
  id: string;
  x: number; // snapshot index
  y: number; // R-Multiple value
  snapshotId: Id<"snapshots">;
};

/**
 * Calculate R-Multiple for a single TP/SL point
 * Treats the point as if it had 100% margin
 * Returns positive value for TP, negative value for SL
 *
 * For stop losses: Returns the negative of the risk amount relative to a reference risk
 * This ensures that when SL is very close to entry, the R-Multiple change is small
 */
function calculateSinglePointRMultiple(
  entryPrice: number,
  tpslPrice: number,
  tpslType: "take_profit" | "stop_loss",
  direction: "long" | "short"
): number {
  // Use a reference risk of 1% of entry price for normalization
  const referenceRisk = entryPrice * 0.01;

  if (direction === "long") {
    if (tpslType === "take_profit") {
      // For long TP: profit = TP_price - Entry_price
      const profit = tpslPrice - entryPrice;
      return profit / referenceRisk; // Positive for TP
    } else {
      // For long SL: risk = Entry_price - SL_price
      // Return negative of risk relative to reference risk
      // This ensures small risks result in small R-Multiple changes
      const risk = entryPrice - tpslPrice;
      // Cap the risk to prevent division by zero or extreme values
      // If risk is very small (< 0.1% of entry), treat it as minimal risk
      const normalizedRisk = Math.max(risk, entryPrice * 0.001);
      return -(normalizedRisk / referenceRisk); // Negative for SL
    }
  } else {
    // Short position
    if (tpslType === "take_profit") {
      // For short TP: profit = Entry_price - TP_price
      const profit = entryPrice - tpslPrice;
      return profit / referenceRisk; // Positive for TP
    } else {
      // For short SL: risk = SL_price - Entry_price
      const risk = tpslPrice - entryPrice;
      // Cap the risk to prevent division by zero or extreme values
      const normalizedRisk = Math.max(risk, entryPrice * 0.001);
      return -(normalizedRisk / referenceRisk); // Negative for SL
    }
  }
}

/**
 * Calculate progression paths for the chart
 * @param snapshots - All snapshots up to and including the current snapshot
 * @param direction - Trade direction (long/short)
 * @param currentSnapshotId - The ID of the current snapshot (from search params) - determines which TP/SL entries are possibilities
 */
export function calculateProgressionPaths(
  snapshots: SnapshotWithTpsl[],
  direction: "long" | "short",
  currentSnapshotId?: Id<"snapshots">
): ProgressionChartData[] {
  if (snapshots.length === 0) {
    return [];
  }

  const paths: ProgressionChartData[] = [];
  const referencePoints: ReferencePoint[] = [];

  // Find the current snapshot index (the one we're viewing)
  const currentSnapshotIndex = currentSnapshotId
    ? snapshots.findIndex((s) => s.snapshotId === currentSnapshotId)
    : snapshots.length - 1; // Default to last snapshot if not specified

  if (currentSnapshotIndex === -1) {
    return [];
  }

  // Start with initial reference point at (0, 0) - first snapshot
  const startPoint: ReferencePoint = {
    id: "start-0",
    x: 0,
    y: 0,
    snapshotId: snapshots[0].snapshotId,
  };
  referencePoints.push(startPoint);

  paths.push({
    x: 0,
    y: 0,
    referencePointId: "start",
    type: "start",
    isHit: true,
    isGhost: false,
    snapshotId: snapshots[0].snapshotId,
  });

  // Process all snapshots up to and including the current one
  // Find all TP/SL entries that were hit in previous snapshots (these become reference points)
  // Track which entries have already been processed to prevent duplicates
  const processedEntryIds = new Set<Id<"tpsl_entries">>();

  console.log("=== PROCESSING SNAPSHOTS ===");
  for (let i = 0; i <= currentSnapshotIndex; i++) {
    const snapshot = snapshots[i];
    if (!snapshot.entryPrice) continue;

    console.log(`\n--- Snapshot ${i} (ID: ${snapshot.snapshotId}) ---`);
    console.log(`Processed entry IDs so far:`, Array.from(processedEntryIds));
    console.log(
      `All entries in this snapshot:`,
      snapshot.tpslEntries.map((e) => ({
        id: e.id,
        type: e.type,
        isHit: e.isHit,
        hitSnapshotId: e.hitSnapshotId,
        alreadyProcessed: processedEntryIds.has(e.id),
      }))
    );

    // Find all TP/SL entries that were hit in THIS specific snapshot
    // Only include entries where hitSnapshotId matches this snapshot's ID
    // Skip entries that have already been processed in previous snapshots
    const hitEntries = snapshot.tpslEntries.filter(
      (entry) =>
        entry.isHit &&
        entry.hitSnapshotId === snapshot.snapshotId &&
        !processedEntryIds.has(entry.id)
    );

    console.log(
      `Filtered hit entries for snapshot ${i}:`,
      hitEntries.map((e) => ({
        id: e.id,
        type: e.type,
        price: e.price,
      }))
    );

    // Only use the most recent hit entry as the reference point for this snapshot
    // If multiple entries are hit in the same snapshot, use the last one
    const mostRecentHitEntry = hitEntries[hitEntries.length - 1];

    if (mostRecentHitEntry) {
      // Calculate R-Multiple for this hit entry (treating it as 100% margin)
      // This gives us the R-Multiple value for this specific TP/SL
      const rMultiple = calculateSinglePointRMultiple(
        snapshot.entryPrice,
        mostRecentHitEntry.price,
        mostRecentHitEntry.type,
        direction
      );

      // Position this TP/SL at its own R-Multiple value (not cumulative)
      // The reference point is only used to track the current state, not for positioning
      const refPoint =
        referencePoints[referencePoints.length - 1] || startPoint;

      // Add hit point at its own R-Multiple value
      // IMPORTANT: x should be the snapshot index where it was hit (i)
      const hitPoint: ProgressionChartData = {
        x: i, // Snapshot index where this TP/SL was hit
        y: rMultiple, // Use the TP/SL's own R-Multiple, not cumulative
        referencePointId: refPoint.id,
        tpslEntryId: mostRecentHitEntry.id,
        type: mostRecentHitEntry.type === "take_profit" ? "tp" : "sl",
        isHit: true,
        isGhost: false,
        snapshotId: snapshot.snapshotId, // Snapshot ID where it was hit
      };

      paths.push(hitPoint);
      console.log(
        `Added hit point: x=${i}, y=${rMultiple}, tpslEntryId=${mostRecentHitEntry.id}`
      );

      // Mark this entry as processed to prevent duplicates in later snapshots
      processedEntryIds.add(mostRecentHitEntry.id);
      console.log(`Marked ${mostRecentHitEntry.id} as processed`);

      // Only the most recent hit becomes the new reference point
      referencePoints.push({
        id: `hit-${mostRecentHitEntry.id}-${i}`,
        x: i,
        y: rMultiple, // Store the TP/SL's own R-Multiple as the reference
        snapshotId: snapshot.snapshotId,
      });
    }

    // Add all hit points to paths (for display), but only most recent becomes reference
    for (const entry of hitEntries) {
      // Skip if we already added this entry above
      if (entry.id === mostRecentHitEntry?.id) continue;

      const rMultiple = calculateSinglePointRMultiple(
        snapshot.entryPrice,
        entry.price,
        entry.type,
        direction
      );

      const refPoint =
        referencePoints[referencePoints.length - 1] || startPoint;

      const hitPoint: ProgressionChartData = {
        x: i, // Snapshot index where this TP/SL was hit
        y: rMultiple,
        referencePointId: refPoint.id,
        tpslEntryId: entry.id,
        type: entry.type === "take_profit" ? "tp" : "sl",
        isHit: true,
        isGhost: false,
        snapshotId: snapshot.snapshotId, // Snapshot ID where it was hit
      };

      paths.push(hitPoint);
      console.log(
        `Added hit point: x=${i}, y=${rMultiple}, tpslEntryId=${entry.id}`
      );

      // Mark this entry as processed to prevent duplicates in later snapshots
      processedEntryIds.add(entry.id);
      console.log(`Marked ${entry.id} as processed`);
    }
  }
  console.log("\n=== FINISHED PROCESSING SNAPSHOTS ===");
  console.log(`Final processed entry IDs:`, Array.from(processedEntryIds));

  // Now, for the current snapshot, get all unhit TP/SL entries (these are the possibilities/ghost paths)
  const currentSnapshot = snapshots[currentSnapshotIndex];
  if (!currentSnapshot || !currentSnapshot.entryPrice) {
    return paths;
  }

  // Get all TP/SL entries ONLY from the current snapshot that are NOT hit
  // Filter to ensure we only use entries that belong to this specific snapshot
  // Also exclude entries that were hit in previous snapshots (they've already been filled)
  // IMPORTANT: Only use entries from the current snapshot - entries may be copied across snapshots in DB
  // The query already filters by snapshotId, so currentSnapshot.tpslEntries should only contain entries for this snapshot

  // Build a set of entry IDs that were hit in previous snapshots
  const hitEntryIds = new Set<Id<"tpsl_entries">>();
  for (let i = 0; i < currentSnapshotIndex; i++) {
    const snapshot = snapshots[i];
    snapshot.tpslEntries.forEach((entry) => {
      if (entry.isHit && entry.hitSnapshotId) {
        hitEntryIds.add(entry.id);
      }
    });
  }

  // Debug: Log all entries from current snapshot
  console.log("=== PROGRESSION CALCULATOR DEBUG ===");
  console.log(`Current snapshot index: ${currentSnapshotIndex}`);
  console.log(`Current snapshot ID: ${currentSnapshot.snapshotId}`);
  console.log(
    `All entries in current snapshot:`,
    JSON.stringify(
      currentSnapshot.tpslEntries.map((e) => ({
        id: e.id,
        type: e.type,
        price: e.price,
        isHit: e.isHit,
        hitSnapshotId: e.hitSnapshotId,
      })),
      null,
      2
    )
  );
  console.log(
    `Hit entry IDs from previous snapshots:`,
    Array.from(hitEntryIds)
  );

  // Filter entries: must not be hit, must not have been hit in a previous snapshot
  const unhitEntries = currentSnapshot.tpslEntries.filter(
    (entry) =>
      !entry.isHit && !entry.hitSnapshotId && !hitEntryIds.has(entry.id)
  );

  console.log(
    `Unhit entries (possibilities):`,
    JSON.stringify(
      unhitEntries.map((e) => ({
        id: e.id,
        type: e.type,
        price: e.price,
        margin: e.margin,
      })),
      null,
      2
    )
  );
  console.log(
    `Total unhit entries: ${unhitEntries.length} (${unhitEntries.filter((e) => e.type === "take_profit").length} TP, ${unhitEntries.filter((e) => e.type === "stop_loss").length} SL)`
  );
  console.log(
    `Reference points: ${referencePoints.length}`,
    JSON.stringify(
      referencePoints.map((rp) => ({
        id: rp.id,
        x: rp.x,
        y: rp.y,
        snapshotId: rp.snapshotId,
      })),
      null,
      2
    )
  );
  console.log("====================================");

  // Create ghost paths from the most recent reference point to each unhit TP/SL entry
  // Only use the most recent reference point to avoid duplicate ghost paths
  const mostRecentRefPoint =
    referencePoints[referencePoints.length - 1] || startPoint;

  console.log(
    `Using reference point:`,
    JSON.stringify(
      {
        id: mostRecentRefPoint.id,
        x: mostRecentRefPoint.x,
        y: mostRecentRefPoint.y,
      },
      null,
      2
    )
  );

  // Find which snapshot this reference point belongs to
  const refSnapshotIndex = snapshots.findIndex(
    (s) => s.snapshotId === mostRecentRefPoint.snapshotId
  );

  if (refSnapshotIndex !== -1) {
    const refSnapshot = snapshots[refSnapshotIndex];
    if (refSnapshot.entryPrice) {
      // Create ghost paths to each unhit entry from the current snapshot
      for (const entry of unhitEntries) {
        // Calculate R-Multiple for this possibility
        // Each TP/SL is positioned at its own R-Multiple value (from entry), not cumulative
        const rMultiple = calculateSinglePointRMultiple(
          refSnapshot.entryPrice,
          entry.price,
          entry.type,
          direction
        );

        // Position ghost point at its own R-Multiple value
        // If this is a stop loss and we have a realized TP, use the TP's R-Multiple
        // (since TP was already realized and SL only stops out remaining position)
        let newRMultiple: number;
        if (entry.type === "stop_loss" && mostRecentRefPoint.id !== "start-0") {
          // If we have a realized TP and then get stopped out, we keep the realized TP's R-Multiple
          newRMultiple = mostRecentRefPoint.y;
        } else {
          // For take profits or stop losses from start point, use the TP/SL's own R-Multiple
          newRMultiple = rMultiple;
        }

        // Create ghost path point one snapshot in the future (x + 1)
        const ghostPoint: ProgressionChartData = {
          x: currentSnapshotIndex + 1,
          y: newRMultiple,
          referencePointId: mostRecentRefPoint.id,
          tpslEntryId: entry.id,
          type: entry.type === "take_profit" ? "tp" : "sl",
          isHit: false,
          isGhost: true,
          snapshotId: currentSnapshot.snapshotId,
        };

        paths.push(ghostPoint);
      }
    }
  }

  // Filter paths to only show hit points at the snapshot where they were actually hit
  // When viewing a specific snapshot, only show hit points from that snapshot and earlier
  // But hit points should only appear at their exact snapshot index (x === snapshotIndex)
  console.log(`Before filtering: ${paths.length} paths`);
  console.log(
    `Hit points before filtering:`,
    paths
      .filter((p) => p.isHit && !p.isGhost)
      .map((p) => ({
        x: p.x,
        y: p.y,
        snapshotId: p.snapshotId,
        tpslEntryId: p.tpslEntryId,
      }))
  );

  // Check for duplicate points at x=2
  const pointsAtX2 = paths.filter((p) => p.x === 2 && p.isHit && !p.isGhost);
  console.log(
    `Points at x=2:`,
    pointsAtX2.map((p) => ({
      x: p.x,
      y: p.y,
      snapshotId: p.snapshotId,
      tpslEntryId: p.tpslEntryId,
    }))
  );

  // Filter hit points: only show entries where hitSnapshotId matches the snapshot ID at that index
  // This ensures we only display TP/SL entries that were actually hit in that specific snapshot
  // Entries copied across snapshots will have different hitSnapshotId values, so duplicates are filtered out
  console.log("\n=== FILTERING HIT POINTS BY hitSnapshotId ===");

  const filteredPaths = paths.filter((point) => {
    // If it's a hit point (not ghost, not start), verify it's at the correct snapshot
    if (point.isHit && !point.isGhost && point.type !== "start") {
      // Find the snapshot that matches this point's snapshotId
      const snapshotIndex = snapshots.findIndex(
        (s) => s.snapshotId === point.snapshotId
      );
      // Only show if:
      // 1. The point's x matches the snapshot index where it was hit (x === snapshotIndex)
      // 2. The snapshot index is <= currentSnapshotIndex (don't show future snapshots)
      // 3. This is the earliest occurrence of this tpslEntryId (no duplicate at different x)
      if (snapshotIndex === -1) {
        console.log(`Filtering out point: snapshot not found`, {
          point,
          snapshotId: point.snapshotId,
        });
        return false; // Snapshot not found, don't show
      }

      // Check if this entry's hitSnapshotId matches the snapshot ID at this index
      // Only show entries that were actually hit in this specific snapshot (using hitSnapshotId from schema)
      if (point.tpslEntryId) {
        // Find the entry in the snapshot at this index
        const snapshotAtThisIndex = snapshots[snapshotIndex];
        if (snapshotAtThisIndex) {
          const entry = snapshotAtThisIndex.tpslEntries.find(
            (e) => e.id === point.tpslEntryId
          );
          if (entry) {
            // Only show if the entry's hitSnapshotId matches the snapshot ID at this index
            // This ensures we only show entries that were actually hit in this snapshot
            if (
              entry.hitSnapshotId &&
              entry.hitSnapshotId !== snapshotAtThisIndex.snapshotId
            ) {
              console.log(
                `✓ FILTERING OUT hit point: tpslEntryId=${point.tpslEntryId}, x=${point.x}, entry.hitSnapshotId=${entry.hitSnapshotId}, snapshotAtThisIndex.snapshotId=${snapshotAtThisIndex.snapshotId}, y=${point.y}`
              );
              return false; // This entry was hit in a different snapshot, don't show it here
            } else {
              console.log(
                `✓ Keeping hit point: tpslEntryId=${point.tpslEntryId}, x=${point.x}, entry.hitSnapshotId=${entry.hitSnapshotId || "undefined"}, snapshotAtThisIndex.snapshotId=${snapshotAtThisIndex.snapshotId}`
              );
            }
          } else {
            console.log(
              `Entry not found for tpslEntryId=${point.tpslEntryId} in snapshot at index ${snapshotIndex} (${snapshotAtThisIndex.snapshotId})`
            );
          }
        }
      } else {
        console.log(`No tpslEntryId for point at x=${point.x}, y=${point.y}`);
      }

      // Hit points should only appear at their exact snapshot index
      // Show hit points from all snapshots up to current, but only at their own x position
      // This means TP1 (x=1) shows at x=1, TP2 (x=2) shows at x=2, etc.
      const shouldShow =
        point.x === snapshotIndex && point.x <= currentSnapshotIndex;
      if (!shouldShow) {
        console.log(
          `Filtering out hit point: x=${point.x}, snapshotIndex=${snapshotIndex}, currentSnapshotIndex=${currentSnapshotIndex}, y=${point.y}`
        );
      } else {
        console.log(
          `Keeping hit point: x=${point.x}, snapshotIndex=${snapshotIndex}, y=${point.y}`
        );
      }
      return shouldShow;
    }
    // Show all ghost points, start points, and other non-hit points
    return true;
  });

  console.log(
    `Filtered paths: ${filteredPaths.length} (from ${paths.length} total)`
  );
  console.log(
    `Hit points after filtering:`,
    filteredPaths
      .filter((p) => p.isHit && !p.isGhost)
      .map((p) => ({ x: p.x, y: p.y, type: p.type }))
  );

  return filteredPaths;
}
