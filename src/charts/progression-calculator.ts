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
  y: number; // R-Multiple value (cumulative weighted)
  snapshotId: Id<"snapshots">;
  cumulativeWeightedProfit: number; // Sum of (profit * margin / 100) for hit TPs
  cumulativeWeightedRisk: number; // Sum of (risk * margin / 100) for hit SLs
  cumulativeHitTPWeight: number; // Total weight of hit TPs (to calculate remaining position)
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
} {
  let newWeightedProfit = previousRefPoint.cumulativeWeightedProfit;
  let newWeightedRisk = previousRefPoint.cumulativeWeightedRisk;
  let newCumulativeHitTPWeight = previousRefPoint.cumulativeHitTPWeight;

  if (direction === "long") {
    if (newEntry.type === "take_profit") {
      const profit = newEntry.price - entryPrice;
      newWeightedProfit += profit * (newEntry.margin / 100);
      newCumulativeHitTPWeight += newEntry.margin;
    } else {
      // For stop loss: calculate remaining position weight
      const remainingPositionWeight = 100 - newCumulativeHitTPWeight;
      // Apply SL margin to remaining position only
      const effectiveSLMargin =
        newEntry.margin * (remainingPositionWeight / 100);
      const risk = entryPrice - newEntry.price;
      const normalizedRisk = Math.max(risk, entryPrice * 0.001);
      // Subtract the loss from weighted profit (SL has negative effect)
      const loss = -(normalizedRisk * (effectiveSLMargin / 100));
      newWeightedProfit += loss;
      newWeightedRisk += normalizedRisk * (effectiveSLMargin / 100);
    }
  } else {
    if (newEntry.type === "take_profit") {
      const profit = entryPrice - newEntry.price;
      newWeightedProfit += profit * (newEntry.margin / 100);
      newCumulativeHitTPWeight += newEntry.margin;
    } else {
      // For stop loss: calculate remaining position weight
      const remainingPositionWeight = 100 - newCumulativeHitTPWeight;
      // Apply SL margin to remaining position only
      const effectiveSLMargin =
        newEntry.margin * (remainingPositionWeight / 100);
      const risk = newEntry.price - entryPrice;
      const normalizedRisk = Math.max(risk, entryPrice * 0.001);
      // Subtract the loss from weighted profit (SL has negative effect)
      const loss = -(normalizedRisk * (effectiveSLMargin / 100));
      newWeightedProfit += loss;
      newWeightedRisk += normalizedRisk * (effectiveSLMargin / 100);
    }
  }

  // For R-multiple calculation, always use reference risk as the denominator
  // This ensures consistent R-multiple calculation and proper comparison
  // When SL is hit after TPs, the loss reduces weightedProfit,
  // which decreases R-multiple relative to the reference point
  const effectiveRisk = referenceRisk;

  // R-multiple = weighted profit / reference risk
  // When SL is hit after TPs:
  // - weightedProfit decreases (loss subtracted)
  // - denominator stays constant (referenceRisk)
  // - Result: R-multiple decreases from reference point
  const rMultiple = newWeightedProfit / effectiveRisk;

  return {
    rMultiple,
    weightedProfit: newWeightedProfit,
    weightedRisk: newWeightedRisk,
    cumulativeHitTPWeight: newCumulativeHitTPWeight,
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
      // Sort hit entries to process them in order (TPs first, then SLs)
      const sortedHitEntries = [...hitEntries].sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "take_profit" ? -1 : 1;
        }
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
        });

        processedEntryIds.add(entry.id);

        // Update reference point after each entry to build cumulatively
        // This ensures TP2's calculation includes TP1's contribution
        referencePoints.push({
          id: `hit-${entry.id}-${i}`,
          x: i,
          y: result.rMultiple,
          snapshotId: snapshot.snapshotId,
          cumulativeWeightedProfit: result.weightedProfit,
          cumulativeWeightedRisk: result.weightedRisk,
          cumulativeHitTPWeight: result.cumulativeHitTPWeight,
        });
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

  const refSnapshotIndex = snapshots.findIndex(
    (s) => s.snapshotId === mostRecentRefPoint.snapshotId
  );

  if (refSnapshotIndex !== -1) {
    const refSnapshot = snapshots[refSnapshotIndex];
    if (refSnapshot.entryPrice) {
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
        };

        paths.push({
          x: mostRecentRefPoint.x + (index + 1),
          y: result.rMultiple,
          referencePointId: mostRecentRefPoint.id,
          tpslEntryId: entry.id,
          type: "tp",
          isHit: false,
          isGhost: true,
          snapshotId: currentSnapshot.snapshotId,
        });
      }

      // Process SLs: each SL positioned at referencePoint.x + (index + 1)
      // SL1 at index 1, SL2 at index 2, etc. (same indices as TPs, different Y values)
      let cumulativeRefPointSL = mostRecentRefPoint;
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
        };

        paths.push({
          x: mostRecentRefPoint.x + (index + 1),
          y: result.rMultiple,
          referencePointId: mostRecentRefPoint.id,
          tpslEntryId: entry.id,
          type: "sl",
          isHit: false,
          isGhost: true,
          snapshotId: currentSnapshot.snapshotId,
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
