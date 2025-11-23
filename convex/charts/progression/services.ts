import { Id } from "../../_generated/dataModel";

/**
 * Type for a TP/SL entry in the progression calculation
 */
type TpslEntry = {
  id: Id<"tpsl_entries">;
  type: "take_profit" | "stop_loss";
  price: number;
  margin: number;
  isHit: boolean;
  hitSnapshotId?: Id<"snapshots">;
  hitAt?: number;
};

/**
 * Type for a snapshot with TP/SL entries
 */
type SnapshotWithTpsl = {
  snapshotId: Id<"snapshots">;
  index: number;
  entryPrice?: number;
  tpslEntries: TpslEntry[];
  createdAt: number;
};

/**
 * Reference point for cumulative R-Multiple calculations
 */
type ReferencePoint = {
  id: string;
  x: number; // snapshot index
  y: number; // R-Multiple value (cumulative weighted)
  snapshotId: Id<"snapshots">;
  cumulativeWeightedProfit: number; // Sum of (profit * margin / 100) for hit TPs
  cumulativeWeightedRisk: number; // Sum of (risk * margin / 100) for hit SLs
  cumulativeHitTPWeight: number; // Total weight of hit TPs (to calculate remaining position)
  cumulativeHitSLWeight: number; // Total weight of hit SLs (to calculate remaining position)
};

/**
 * Progression chart data point
 */
export type ProgressionChartData = {
  x: number; // snapshot index
  y: number; // R-Multiple value
  referencePointId: string; // ID of the reference point this path came from
  tpslEntryId?: Id<"tpsl_entries">; // ID of the TP/SL entry (if applicable)
  type: "tp" | "sl" | "start"; // type of point
  isHit: boolean; // whether this TP/SL was actually hit
  isGhost: boolean; // true for ghost paths, false for actual hits
  snapshotId?: Id<"snapshots">; // snapshot ID if applicable
  isLastPoint?: boolean; // true if this is the last point (position fully closed)
  margin?: number; // margin percentage for TP/SL entries
  entryIndex?: number; // index of TP/SL entry (1-based) for labeling (TP1, TP2, etc.)
};

/**
 * Get reference risk from the first SL in the snapshots
 */
function getReferenceRisk(
  snapshots: SnapshotWithTpsl[],
  entryPrice: number,
  direction: "long" | "short"
): number {
  for (const snapshot of snapshots) {
    const firstSL = snapshot.tpslEntries.find((e) => e.type === "stop_loss");
    if (firstSL) {
      if (direction === "long") {
        const risk = entryPrice - firstSL.price;
        return Math.max(risk, entryPrice * 0.001);
      } else {
        const risk = firstSL.price - entryPrice;
        return Math.max(risk, entryPrice * 0.001);
      }
    }
  }
  // Fallback to 1% of entry price
  return entryPrice * 0.01;
}

/**
 * Calculate cumulative R-Multiple considering weights
 * Uses weighted profit / weighted risk approach
 * Returns the updated reference point with new cumulative values
 */
function calculateCumulativeRMultiple(
  previousRefPoint: ReferencePoint,
  newEntry: TpslEntry,
  entryPrice: number,
  direction: "long" | "short",
  referenceRisk: number
): {
  rMultiple: number;
  weightedProfit: number;
  weightedRisk: number;
  cumulativeHitTPWeight: number;
  cumulativeHitSLWeight: number;
} {
  let newWeightedProfit = previousRefPoint.cumulativeWeightedProfit;
  let newWeightedRisk = previousRefPoint.cumulativeWeightedRisk;
  let newCumulativeHitTPWeight = previousRefPoint.cumulativeHitTPWeight;
  let newCumulativeHitSLWeight = previousRefPoint.cumulativeHitSLWeight;

  if (direction === "long") {
    if (newEntry.type === "take_profit") {
      const profit = newEntry.price - entryPrice;
      const contribution = profit * (newEntry.margin / 100);
      newWeightedProfit += contribution;
      newCumulativeHitTPWeight += newEntry.margin;
    } else {
      const risk = entryPrice - newEntry.price;
      if (risk > 0) {
        const loss = -(risk * (newEntry.margin / 100));
        newWeightedProfit += loss;
        newWeightedRisk += risk * (newEntry.margin / 100);
      }
      newCumulativeHitSLWeight += newEntry.margin;
    }
  } else {
    if (newEntry.type === "take_profit") {
      const profit = entryPrice - newEntry.price;
      const contribution = profit * (newEntry.margin / 100);
      newWeightedProfit += contribution;
      newCumulativeHitTPWeight += newEntry.margin;
    } else {
      const risk = newEntry.price - entryPrice;
      if (risk > 0) {
        const loss = -(risk * (newEntry.margin / 100));
        newWeightedProfit += loss;
        newWeightedRisk += risk * (newEntry.margin / 100);
      }
      newCumulativeHitSLWeight += newEntry.margin;
    }
  }

  const rMultiple = newWeightedProfit / referenceRisk;

  return {
    rMultiple,
    weightedProfit: newWeightedProfit,
    weightedRisk: newWeightedRisk,
    cumulativeHitTPWeight: newCumulativeHitTPWeight,
    cumulativeHitSLWeight: newCumulativeHitSLWeight,
  };
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

  // Get reference risk from first SL
  const firstSnapshot = snapshots.find((s) => s.entryPrice);
  const referenceRisk = firstSnapshot
    ? getReferenceRisk(snapshots, firstSnapshot.entryPrice!, direction)
    : 0;

  // Start with initial reference point at (0, 0) - first snapshot
  const startPoint: ReferencePoint = {
    id: "start-0",
    x: 0,
    y: 0,
    snapshotId: snapshots[0].snapshotId,
    cumulativeWeightedProfit: 0,
    cumulativeWeightedRisk: 0,
    cumulativeHitTPWeight: 0,
    cumulativeHitSLWeight: 0,
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

  const processedEntryIds = new Set<Id<"tpsl_entries">>();
  let tpIndex = 0;
  let slIndex = 0;

  for (let i = 0; i <= currentSnapshotIndex; i++) {
    const snapshot = snapshots[i];
    if (!snapshot.entryPrice) continue;

    const hitEntries = snapshot.tpslEntries.filter(
      (entry) =>
        entry.isHit &&
        entry.hitSnapshotId === snapshot.snapshotId &&
        !processedEntryIds.has(entry.id)
    );

    // Process hit entries in order, building cumulatively
    // Each entry builds on the previous one's cumulative R-multiple
    if (hitEntries.length > 0) {
      // Sort hit entries chronologically by hitAt timestamp when available
      // This ensures correct order when both TP and SL are hit in the same snapshot
      const sortedHitEntries = [...hitEntries].sort((a, b) => {
        // If both have hitAt timestamps, sort chronologically
        if (a.hitAt && b.hitAt) {
          return a.hitAt - b.hitAt;
        }
        // Fallback to type-based sorting (TPs first) if timestamps are missing
        if (a.type !== b.type) {
          return a.type === "take_profit" ? -1 : 1;
        }
        // If same type, sort by price
        return direction === "long" ? a.price - b.price : b.price - a.price;
      });

      // Process each hit entry, building cumulatively
      // Each entry's Y value includes all previous entries' contributions
      for (const entry of sortedHitEntries) {
        const previousRefPoint =
          referencePoints[referencePoints.length - 1] || startPoint;

        const result = calculateCumulativeRMultiple(
          previousRefPoint,
          entry,
          snapshot.entryPrice,
          direction,
          referenceRisk
        );

        // Track indices for labeling
        const isTP = entry.type === "take_profit";
        if (isTP) {
          tpIndex++;
        } else {
          slIndex++;
        }

        // Display each hit entry at its hit snapshot index
        // TP1 at index 1, TP2 at index 2 (with cumulative value), etc.
        paths.push({
          x: i,
          y: result.rMultiple,
          referencePointId: previousRefPoint.id,
          tpslEntryId: entry.id,
          type: entry.type === "take_profit" ? "tp" : "sl",
          isHit: true,
          isGhost: false,
          snapshotId: snapshot.snapshotId,
          margin: entry.margin,
          entryIndex: isTP ? tpIndex : slIndex,
        });

        processedEntryIds.add(entry.id);

        // Update reference point after each entry to build cumulatively
        // This ensures TP2's calculation includes TP1's contribution
        const newRefPoint = {
          id: `hit-${entry.id}-${i}`,
          x: i,
          y: result.rMultiple,
          snapshotId: snapshot.snapshotId,
          cumulativeWeightedProfit: result.weightedProfit,
          cumulativeWeightedRisk: result.weightedRisk,
          cumulativeHitTPWeight: result.cumulativeHitTPWeight,
          cumulativeHitSLWeight: result.cumulativeHitSLWeight,
        };
        referencePoints.push(newRefPoint);

        // Check if position becomes fully closed after this entry
        const isPositionFullyClosed =
          result.cumulativeHitTPWeight + result.cumulativeHitSLWeight >= 100;
        if (isPositionFullyClosed) {
          // Mark this as the last point
          const lastPathIndex = paths.length - 1;
          if (lastPathIndex >= 0) {
            paths[lastPathIndex].isLastPoint = true;
          }
        }
      }
    }
  }

  const currentSnapshot = snapshots[currentSnapshotIndex];
  if (!currentSnapshot || !currentSnapshot.entryPrice) {
    return paths;
  }

  const hitEntryIds = new Set<Id<"tpsl_entries">>();
  for (let i = 0; i < currentSnapshotIndex; i++) {
    const snapshot = snapshots[i];
    snapshot.tpslEntries.forEach((entry) => {
      if (entry.isHit && entry.hitSnapshotId) {
        hitEntryIds.add(entry.id);
      }
    });
  }

  const unhitEntries = currentSnapshot.tpslEntries.filter(
    (entry) =>
      !entry.isHit && !entry.hitSnapshotId && !hitEntryIds.has(entry.id)
  );

  const mostRecentRefPoint =
    referencePoints[referencePoints.length - 1] || startPoint;

  // Check if position is fully closed (all TP/SL weight has been hit)
  const isPositionFullyClosed =
    mostRecentRefPoint.cumulativeHitTPWeight +
      mostRecentRefPoint.cumulativeHitSLWeight >=
    100;

  // Mark the last hit point if position is fully closed
  if (isPositionFullyClosed && paths.length > 0) {
    // Find the last hit point (not ghost) and mark it
    for (let i = paths.length - 1; i >= 0; i--) {
      if (paths[i].isHit && !paths[i].isGhost) {
        paths[i].isLastPoint = true;
        break;
      }
    }
  }

  const refSnapshotIndex = snapshots.findIndex(
    (s) => s.snapshotId === mostRecentRefPoint.snapshotId
  );

  if (refSnapshotIndex !== -1) {
    const refSnapshot = snapshots[refSnapshotIndex];
    if (refSnapshot.entryPrice) {
      // Don't generate ghost paths if position is fully closed
      if (isPositionFullyClosed) {
        return paths;
      }

      // Separate TPs and SLs, sort each group independently
      const unhitTPs = unhitEntries
        .filter((e) => e.type === "take_profit")
        .sort((a, b) =>
          direction === "long" ? a.price - b.price : b.price - a.price
        );
      const unhitSLs = unhitEntries
        .filter((e) => e.type === "stop_loss")
        .sort((a, b) =>
          direction === "long" ? b.price - a.price : a.price - b.price
        );

      // Process TPs: each TP positioned at referencePoint.x + (index + 1)
      // TP1 at index 1, TP2 at index 2, TP3 at index 3, etc.
      let cumulativeRefPointTP = mostRecentRefPoint;
      let ghostTPIndex = tpIndex;
      for (let index = 0; index < unhitTPs.length; index++) {
        const entry = unhitTPs[index];

        const result = calculateCumulativeRMultiple(
          cumulativeRefPointTP,
          entry,
          refSnapshot.entryPrice,
          direction,
          referenceRisk
        );

        cumulativeRefPointTP = {
          id: `ghost-tp-${entry.id}-${index}`,
          x: cumulativeRefPointTP.x,
          y: result.rMultiple,
          snapshotId: cumulativeRefPointTP.snapshotId,
          cumulativeWeightedProfit: result.weightedProfit,
          cumulativeWeightedRisk: result.weightedRisk,
          cumulativeHitTPWeight: result.cumulativeHitTPWeight,
          cumulativeHitSLWeight: result.cumulativeHitSLWeight,
        };

        ghostTPIndex++;
        paths.push({
          x: mostRecentRefPoint.x + (index + 1),
          y: result.rMultiple,
          referencePointId: mostRecentRefPoint.id,
          tpslEntryId: entry.id,
          type: "tp",
          isHit: false,
          isGhost: true,
          snapshotId: currentSnapshot.snapshotId,
          margin: entry.margin,
          entryIndex: ghostTPIndex,
        });
      }

      // Process SLs: each SL positioned at referencePoint.x + (index + 1)
      // SL1 at index 1, SL2 at index 2, etc. (same indices as TPs, different Y values)
      // Each SL ghost path shows cumulative effect (SL1, then SL1+SL2, etc.)
      let cumulativeRefPointSL = mostRecentRefPoint;
      let ghostSLIndex = slIndex;
      for (let index = 0; index < unhitSLs.length; index++) {
        const entry = unhitSLs[index];

        const result = calculateCumulativeRMultiple(
          cumulativeRefPointSL,
          entry,
          refSnapshot.entryPrice,
          direction,
          referenceRisk
        );

        cumulativeRefPointSL = {
          id: `ghost-sl-${entry.id}-${index}`,
          x: cumulativeRefPointSL.x,
          y: result.rMultiple,
          snapshotId: cumulativeRefPointSL.snapshotId,
          cumulativeWeightedProfit: result.weightedProfit,
          cumulativeWeightedRisk: result.weightedRisk,
          cumulativeHitTPWeight: result.cumulativeHitTPWeight,
          cumulativeHitSLWeight: result.cumulativeHitSLWeight,
        };

        ghostSLIndex++;
        paths.push({
          x: mostRecentRefPoint.x + (index + 1),
          y: result.rMultiple,
          referencePointId: mostRecentRefPoint.id,
          tpslEntryId: entry.id,
          type: "sl",
          isHit: false,
          isGhost: true,
          snapshotId: currentSnapshot.snapshotId,
          margin: entry.margin,
          entryIndex: ghostSLIndex,
        });
      }
    }
  }

  return paths.filter((point) => {
    if (point.isHit && !point.isGhost && point.type !== "start") {
      const snapshotIndex = snapshots.findIndex(
        (s) => s.snapshotId === point.snapshotId
      );

      if (snapshotIndex === -1) {
        return false;
      }

      if (point.tpslEntryId) {
        const snapshotAtThisIndex = snapshots[snapshotIndex];
        if (snapshotAtThisIndex) {
          const entry = snapshotAtThisIndex.tpslEntries.find(
            (e) => e.id === point.tpslEntryId
          );
          if (
            entry?.hitSnapshotId &&
            entry.hitSnapshotId !== snapshotAtThisIndex.snapshotId
          ) {
            return false;
          }
        }
      }

      return point.x === snapshotIndex && point.x <= currentSnapshotIndex;
    }

    return true;
  });
}

/**
 * Get the current R-multiple value based on hit TP/SL entries
 * Returns the cumulative R-multiple from the last reference point
 * @param snapshots - All snapshots up to and including the current snapshot
 * @param direction - Trade direction (long/short)
 * @param currentSnapshotId - The ID of the current snapshot (optional, defaults to latest)
 * @returns The current R-multiple value or null if no valid data
 */
export function getCurrentRMultiple(
  snapshots: SnapshotWithTpsl[],
  direction: "long" | "short",
  currentSnapshotId?: Id<"snapshots">
): number | null {
  if (snapshots.length === 0) {
    return null;
  }

  const referencePoints: ReferencePoint[] = [];

  // Find the current snapshot index (the one we're viewing)
  const currentSnapshotIndex = currentSnapshotId
    ? snapshots.findIndex((s) => s.snapshotId === currentSnapshotId)
    : snapshots.length - 1; // Default to last snapshot if not specified

  if (currentSnapshotIndex === -1) {
    return null;
  }

  // Get reference risk from first SL
  const firstSnapshot = snapshots.find((s) => s.entryPrice);
  if (!firstSnapshot || !firstSnapshot.entryPrice) {
    return null;
  }

  const referenceRisk = getReferenceRisk(
    snapshots,
    firstSnapshot.entryPrice,
    direction
  );

  if (referenceRisk === 0) {
    return null;
  }

  // Start with initial reference point at (0, 0) - first snapshot
  const startPoint: ReferencePoint = {
    id: "start-0",
    x: 0,
    y: 0,
    snapshotId: snapshots[0].snapshotId,
    cumulativeWeightedProfit: 0,
    cumulativeWeightedRisk: 0,
    cumulativeHitTPWeight: 0,
    cumulativeHitSLWeight: 0,
  };
  referencePoints.push(startPoint);

  const processedEntryIds = new Set<Id<"tpsl_entries">>();

  // Process all snapshots up to the current one
  for (let i = 0; i <= currentSnapshotIndex; i++) {
    const snapshot = snapshots[i];
    if (!snapshot.entryPrice) continue;

    const hitEntries = snapshot.tpslEntries.filter(
      (entry) =>
        entry.isHit &&
        entry.hitSnapshotId === snapshot.snapshotId &&
        !processedEntryIds.has(entry.id)
    );

    // Process hit entries in order, building cumulatively
    if (hitEntries.length > 0) {
      // Sort hit entries chronologically by hitAt timestamp when available
      const sortedHitEntries = [...hitEntries].sort((a, b) => {
        // If both have hitAt timestamps, sort chronologically
        if (a.hitAt && b.hitAt) {
          return a.hitAt - b.hitAt;
        }
        // Fallback to type-based sorting (TPs first) if timestamps are missing
        if (a.type !== b.type) {
          return a.type === "take_profit" ? -1 : 1;
        }
        // If same type, sort by price
        return direction === "long" ? a.price - b.price : b.price - a.price;
      });

      // Process each hit entry, building cumulatively
      for (const entry of sortedHitEntries) {
        const previousRefPoint =
          referencePoints[referencePoints.length - 1] || startPoint;

        const result = calculateCumulativeRMultiple(
          previousRefPoint,
          entry,
          snapshot.entryPrice,
          direction,
          referenceRisk
        );

        processedEntryIds.add(entry.id);

        // Update reference point after each entry to build cumulatively
        const newRefPoint = {
          id: `hit-${entry.id}-${i}`,
          x: i,
          y: result.rMultiple,
          snapshotId: snapshot.snapshotId,
          cumulativeWeightedProfit: result.weightedProfit,
          cumulativeWeightedRisk: result.weightedRisk,
          cumulativeHitTPWeight: result.cumulativeHitTPWeight,
          cumulativeHitSLWeight: result.cumulativeHitSLWeight,
        };
        referencePoints.push(newRefPoint);
      }
    }
  }

  // Return the R-multiple from the last reference point
  const lastRefPoint = referencePoints[referencePoints.length - 1];
  return lastRefPoint ? lastRefPoint.y : 0;
}
