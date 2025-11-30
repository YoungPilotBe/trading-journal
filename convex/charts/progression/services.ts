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
 * R-Multiple calculation result for a specific combination of entries
 */
export type RMultipleCalculation = {
  combination: Id<"tpsl_entries">[]; // Entry IDs in this combination
  rMultiple: number;
  weightedProfit: number;
  weightedRisk: number;
  totalWeight: number; // Sum of margins for entries in combination
};

/**
 * Hit marker for an entry that was hit in this snapshot
 */
export type HitMarker = {
  entryId: Id<"tpsl_entries">;
  hitSnapshotId: Id<"snapshots">;
  hitAt: number;
  rMultiple: number; // R-multiple at the point this entry was hit
};

/**
 * Blocked marker for an entry that cannot be modified (hit in previous snapshot)
 */
export type BlockedMarker = {
  entryId: Id<"tpsl_entries">;
  reason: "hit_in_previous_snapshot";
  hitSnapshotId: Id<"snapshots">;
  hitAt: number;
  blockedAtSnapshotId: Id<"snapshots">; // Snapshot where this entry became blocked
};

/**
 * Complete result for a single snapshot
 */
export type ProgressionSnapshotResult = {
  snapshotId: Id<"snapshots">;
  index: number;
  entryPrice: number | undefined;
  createdAt: number;
  tpslEntries: Array<
    TpslEntry & {
      isBlocked: boolean;
      blockedReason?: BlockedMarker["reason"];
    }
  >;
  rMultiples: RMultipleCalculation[];
  hitMarkers: HitMarker[];
  blockedMarkers: BlockedMarker[];
  remainingWeight: number; // Remaining position weight (100 - sum of hit weights)
};

/**
 * Progression chart data point (for chart rendering)
 */
export type ProgressionChartData = {
  x: number; // snapshot index
  y: number; // R-Multiple value
  referencePointId: string; // ID of the reference point this path came from
  tpslEntryId?: Id<"tpsl_entries">; // ID of the TP/SL entry (if applicable) - single entry case
  type: "tp" | "sl" | "start"; // type of point
  isHit: boolean; // whether this TP/SL was actually hit
  isGhost: boolean; // true for ghost paths, false for actual hits
  snapshotId?: Id<"snapshots">; // snapshot ID if applicable
  isLastPoint?: boolean; // true if this is the last point (position fully closed)
  margin?: number; // margin percentage for TP/SL entries - single entry case
  entryIndex?: number; // index of TP/SL entry (1-based) for labeling (TP1, TP2, etc.) - single entry case
  // Multiple entries support (when multiple entries are hit in the same snapshot)
  tpslEntryIds?: Id<"tpsl_entries">[]; // array of entry IDs when multiple entries are combined
  margins?: number[]; // array of margins corresponding to each entry
  entryIndices?: number[]; // array of entry indices for labeling (TP1, TP2, etc.)
  entryTypes?: ("tp" | "sl")[]; // array of types for each entry
};

/**
 * Calculate reference risk from the first SL in snapshots
 * Returns the risk amount used as denominator for R-multiple calculations
 */
export function calculateReferenceRisk(
  snapshots: SnapshotWithTpsl[],
  entryPrice: number,
  direction: "long" | "short"
): number {
  const directionMultiplier = direction === "long" ? 1 : -1;

  for (const snapshot of snapshots) {
    const firstSL = snapshot.tpslEntries.find((e) => e.type === "stop_loss");
    if (!firstSL) continue;

    const risk = (entryPrice - firstSL.price) * directionMultiplier;
    const minRisk = entryPrice * 0.001;
    return Math.max(risk, minRisk);
  }

  // Fallback to 1% of entry price
  return entryPrice * 0.01;
}

/**
 * Calculate profit for a single entry (TP or SL)
 * Direction-agnostic calculation
 * TP: positive profit, SL: negative profit (loss)
 */
export function calculateEntryProfit(
  entry: TpslEntry,
  entryPrice: number,
  direction: "long" | "short"
): number {
  const directionMultiplier = direction === "long" ? 1 : -1;

  if (entry.type === "take_profit") {
    // TP: profit is positive
    // For long: (TP_price - Entry_price) > 0 when TP > Entry
    // For short: (Entry_price - TP_price) > 0 when Entry > TP
    return (entry.price - entryPrice) * directionMultiplier;
  } else {
    // SL: profit is negative (loss)
    // For long: (SL_price - Entry_price) < 0 when SL < Entry (loss)
    // For short: (Entry_price - SL_price) < 0 when Entry < SL (loss)
    return (entry.price - entryPrice) * directionMultiplier;
  }
}

/**
 * Calculate risk for a single entry (TP or SL)
 * Direction-agnostic calculation
 */
export function calculateEntryRisk(
  entry: TpslEntry,
  entryPrice: number,
  direction: "long" | "short"
): number {
  const directionMultiplier = direction === "long" ? 1 : -1;
  const priceDiff = (entryPrice - entry.price) * directionMultiplier;

  // Risk is always positive
  return Math.max(priceDiff, 0);
}

/**
 * Calculate R-multiple for a specific combination of entries
 * Each snapshot is independent - calculates based on entries in that snapshot only
 * TP and SL only differ in their effect on R-multiple: TP positive, SL negative
 */
export function calculateRMultipleForCombination(
  entries: TpslEntry[],
  entryPrice: number,
  direction: "long" | "short",
  referenceRisk: number
): RMultipleCalculation {
  let weightedProfit = 0;
  let weightedRisk = 0;
  let totalWeight = 0;

  for (const entry of entries) {
    // Only difference between TP and SL is the sign of profit contribution
    // TP: positive contribution, SL: negative contribution (loss)
    const profit = calculateEntryProfit(entry, entryPrice, direction);
    const weight = entry.margin / 100;

    weightedProfit += profit * weight;

    // Risk only comes from SL entries, not TP entries
    // TP entries don't contribute to risk calculation
    if (entry.type === "stop_loss") {
      const risk = calculateEntryRisk(entry, entryPrice, direction);
      weightedRisk += risk * weight;
    }

    totalWeight += entry.margin;
  }

  const rMultiple = referenceRisk > 0 ? weightedProfit / referenceRisk : 0;

  return {
    combination: entries.map((e) => e.id),
    rMultiple,
    weightedProfit,
    weightedRisk,
    totalWeight,
  };
}

/**
 * Get all blocked entries (hit in previous snapshots)
 * Returns a map of entryId -> BlockedMarker
 */
export function getBlockedEntries(
  currentSnapshotIndex: number,
  snapshots: SnapshotWithTpsl[]
): Map<Id<"tpsl_entries">, BlockedMarker> {
  const blockedMap = new Map<Id<"tpsl_entries">, BlockedMarker>();
  const currentSnapshotId = snapshots[currentSnapshotIndex]?.snapshotId;

  if (!currentSnapshotId) return blockedMap;

  // Iterate through all previous snapshots
  for (let i = 0; i < currentSnapshotIndex; i++) {
    const snapshot = snapshots[i];
    if (!snapshot) continue;

    // Find all hit entries in this previous snapshot
    for (const entry of snapshot.tpslEntries) {
      const isHitInPrevious = entry.isHit && entry.hitSnapshotId;
      const notAlreadyBlocked = !blockedMap.has(entry.id);

      if (isHitInPrevious && notAlreadyBlocked && entry.hitSnapshotId) {
        blockedMap.set(entry.id, {
          entryId: entry.id,
          reason: "hit_in_previous_snapshot",
          hitSnapshotId: entry.hitSnapshotId,
          hitAt: entry.hitAt ?? 0,
          blockedAtSnapshotId: currentSnapshotId,
        });
      }
    }
  }

  return blockedMap;
}

/**
 * Generate all combinations of entries for R-multiple calculation
 * Returns arrays of entry combinations (TP1, TP1+TP2, TP1+TP2+TP3, etc.)
 */
function generateEntryCombinations(
  entries: TpslEntry[],
  direction: "long" | "short"
): TpslEntry[][] {
  const combinations: TpslEntry[][] = [];

  // Sort entries by type and price
  const sortedEntries = [...entries].sort((a, b) => {
    // Sort by type first (TPs and SLs together, but grouped)
    const typeOrder = a.type === b.type ? 0 : a.type === "take_profit" ? -1 : 1;
    if (typeOrder !== 0) return typeOrder;

    // Within same type, sort by price based on direction
    const priceOrder =
      direction === "long" ? a.price - b.price : b.price - a.price;
    return priceOrder;
  });

  // Generate cumulative combinations
  // TP1, TP1+TP2, TP1+TP2+TP3, etc.
  for (let i = 0; i < sortedEntries.length; i++) {
    const combination = sortedEntries.slice(0, i + 1);
    combinations.push(combination);
  }

  return combinations;
}

/**
 * Calculate progression data for a single snapshot
 * Each snapshot is independent - uses only its own TPSL entries
 */
export function calculateSnapshotProgression(
  snapshot: SnapshotWithTpsl,
  previousSnapshots: SnapshotWithTpsl[],
  direction: "long" | "short",
  referenceRisk: number
): ProgressionSnapshotResult {
  const { snapshotId, index, entryPrice, tpslEntries, createdAt } = snapshot;

  // Get blocked entries from previous snapshots
  const blockedMap = getBlockedEntries(previousSnapshots.length, [
    ...previousSnapshots,
    snapshot,
  ]);

  // Mark entries as blocked
  const tpslEntriesWithBlocked = tpslEntries.map((entry) => {
    const blockedMarker = blockedMap.get(entry.id);
    return {
      ...entry,
      isBlocked: !!blockedMarker,
      blockedReason: blockedMarker?.reason,
    };
  });

  // Calculate R-multiples for all combinations
  const combinations = generateEntryCombinations(tpslEntries, direction);
  const rMultiples: RMultipleCalculation[] = [];

  for (const combination of combinations) {
    if (!entryPrice) continue;

    const calculation = calculateRMultipleForCombination(
      combination,
      entryPrice,
      direction,
      referenceRisk
    );
    rMultiples.push(calculation);
  }

  // Find hit markers (entries hit in this snapshot)
  const hitMarkers: HitMarker[] = [];
  for (const entry of tpslEntries) {
    const isHitInThisSnapshot =
      entry.isHit && entry.hitSnapshotId === snapshotId;

    if (isHitInThisSnapshot && entry.hitSnapshotId && entry.hitAt) {
      // Find the R-multiple calculation that includes this entry
      const relevantCalculation = rMultiples.find((calc) =>
        calc.combination.includes(entry.id)
      );

      hitMarkers.push({
        entryId: entry.id,
        hitSnapshotId: entry.hitSnapshotId,
        hitAt: entry.hitAt,
        rMultiple: relevantCalculation?.rMultiple ?? 0,
      });
    }
  }

  // Get blocked markers for this snapshot
  const blockedMarkers: BlockedMarker[] = Array.from(blockedMap.values());

  // Calculate remaining weight
  const hitEntries = tpslEntries.filter((e) => e.isHit && e.hitSnapshotId);
  const hitWeight = hitEntries.reduce((sum, e) => sum + e.margin, 0);
  const remainingWeight = Math.max(0, 100 - hitWeight);

  return {
    snapshotId,
    index,
    entryPrice,
    createdAt,
    tpslEntries: tpslEntriesWithBlocked,
    rMultiples,
    hitMarkers,
    blockedMarkers,
    remainingWeight,
  };
}

/**
 * Calculate progression paths for chart rendering
 * Builds cumulative progression across snapshots for visualization
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
  const currentSnapshotIndex = currentSnapshotId
    ? snapshots.findIndex((s) => s.snapshotId === currentSnapshotId)
    : snapshots.length - 1;

  if (currentSnapshotIndex === -1) {
    return [];
  }

  const firstSnapshot = snapshots.find((s) => s.entryPrice);
  if (!firstSnapshot?.entryPrice) {
    return [];
  }

  const referenceRisk = calculateReferenceRisk(
    snapshots,
    firstSnapshot.entryPrice,
    direction
  );

  // Start point
  paths.push({
    x: 0,
    y: 0,
    referencePointId: "start",
    type: "start",
    isHit: true,
    isGhost: false,
    snapshotId: snapshots[0].snapshotId,
  });

  let cumulativeWeightedProfit = 0;
  let cumulativeHitWeight = 0;
  const processedEntryIds = new Set<Id<"tpsl_entries">>();
  let tpIndex = 0;
  let slIndex = 0;

  // Process hit entries across snapshots (cumulative for chart)
  for (let i = 0; i <= currentSnapshotIndex; i++) {
    const snapshot = snapshots[i];
    if (!snapshot.entryPrice) continue;

    const hitEntries = snapshot.tpslEntries.filter(
      (entry) =>
        entry.isHit &&
        entry.hitSnapshotId === snapshot.snapshotId &&
        !processedEntryIds.has(entry.id)
    );

    if (hitEntries.length === 0) continue;

    // Group entries by type (TP vs SL)
    const tpEntries = hitEntries.filter((e) => e.type === "take_profit");
    const slEntries = hitEntries.filter((e) => e.type === "stop_loss");

    // Sort each group by hitAt timestamp, then by price
    const sortEntries = (entries: typeof hitEntries) => {
      return [...entries].sort((a, b) => {
        const timeDiff = (a.hitAt ?? 0) - (b.hitAt ?? 0);
        if (timeDiff !== 0) return timeDiff;

        const priceDiff =
          direction === "long" ? a.price - b.price : b.price - a.price;
        return priceDiff;
      });
    };

    const sortedTPEntries = sortEntries(tpEntries);
    const sortedSLEntries = sortEntries(slEntries);

    // Process TP entries together
    if (sortedTPEntries.length > 0) {
      const tpEntryIds: Id<"tpsl_entries">[] = [];
      const tpMargins: number[] = [];
      const tpEntryIndices: number[] = [];
      const tpEntryTypes: ("tp" | "sl")[] = [];
      let tpCumulativeProfit = cumulativeWeightedProfit;
      let tpCumulativeWeight = cumulativeHitWeight;

      for (const entry of sortedTPEntries) {
        const profit = calculateEntryProfit(
          entry,
          snapshot.entryPrice,
          direction
        );
        const weight = entry.margin / 100;
        tpCumulativeProfit += profit * weight;
        tpCumulativeWeight += entry.margin;

        tpIndex++;
        tpEntryIds.push(entry.id);
        tpMargins.push(entry.margin);
        tpEntryIndices.push(tpIndex);
        tpEntryTypes.push("tp");
        processedEntryIds.add(entry.id);
      }

      const finalRMultiple = tpCumulativeProfit / referenceRisk;

      // Create point for TP entries (always use arrays)
      paths.push({
        x: i,
        y: finalRMultiple,
        referencePointId:
          tpEntryIds.length === 1
            ? `ref-${i}-${tpEntryIds[0]}`
            : `ref-${i}-tp-${tpEntryIds.join("-")}`,
        type: "tp",
        isHit: true,
        isGhost: false,
        snapshotId: snapshot.snapshotId,
        tpslEntryIds: tpEntryIds,
        margins: tpMargins,
        entryIndices: tpEntryIndices,
        entryTypes: tpEntryTypes,
        isLastPoint: tpCumulativeWeight >= 100,
      });

      // Update cumulative values after processing TP entries
      cumulativeWeightedProfit = tpCumulativeProfit;
      cumulativeHitWeight = tpCumulativeWeight;
    }

    // Process SL entries together
    if (sortedSLEntries.length > 0) {
      const slEntryIds: Id<"tpsl_entries">[] = [];
      const slMargins: number[] = [];
      const slEntryIndices: number[] = [];
      const slEntryTypes: ("tp" | "sl")[] = [];
      let slCumulativeProfit = cumulativeWeightedProfit;
      let slCumulativeWeight = cumulativeHitWeight;

      for (const entry of sortedSLEntries) {
        const profit = calculateEntryProfit(
          entry,
          snapshot.entryPrice,
          direction
        );
        const weight = entry.margin / 100;
        slCumulativeProfit += profit * weight;
        slCumulativeWeight += entry.margin;

        slIndex++;
        slEntryIds.push(entry.id);
        slMargins.push(entry.margin);
        slEntryIndices.push(slIndex);
        slEntryTypes.push("sl");
        processedEntryIds.add(entry.id);
      }

      const finalRMultiple = slCumulativeProfit / referenceRisk;

      // Create point for SL entries (always use arrays)
      paths.push({
        x: i,
        y: finalRMultiple,
        referencePointId:
          slEntryIds.length === 1
            ? `ref-${i}-${slEntryIds[0]}`
            : `ref-${i}-sl-${slEntryIds.join("-")}`,
        type: "sl",
        isHit: true,
        isGhost: false,
        snapshotId: snapshot.snapshotId,
        tpslEntryIds: slEntryIds,
        margins: slMargins,
        entryIndices: slEntryIndices,
        entryTypes: slEntryTypes,
        isLastPoint: slCumulativeWeight >= 100,
      });

      // Update cumulative values after processing SL entries
      cumulativeWeightedProfit = slCumulativeProfit;
      cumulativeHitWeight = slCumulativeWeight;
    }
  }

  // Generate ghost paths for unhit entries in current snapshot
  const currentSnapshot = snapshots[currentSnapshotIndex];
  if (!currentSnapshot?.entryPrice) {
    return paths;
  }

  const isPositionFullyClosed = cumulativeHitWeight >= 100;
  if (isPositionFullyClosed) {
    return paths;
  }

  const hitEntryIds = new Set<Id<"tpsl_entries">>();
  for (let i = 0; i < currentSnapshotIndex; i++) {
    const snapshot = snapshots[i];
    for (const entry of snapshot.tpslEntries) {
      if (entry.isHit && entry.hitSnapshotId) {
        hitEntryIds.add(entry.id);
      }
    }
  }

  const unhitEntries = currentSnapshot.tpslEntries.filter(
    (entry) =>
      !entry.isHit && !entry.hitSnapshotId && !hitEntryIds.has(entry.id)
  );

  // Separate and sort unhit entries
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

  // Generate ghost paths for TPs
  let ghostTPIndex = tpIndex;
  let cumulativeProfitTP = cumulativeWeightedProfit;

  for (let index = 0; index < unhitTPs.length; index++) {
    const entry = unhitTPs[index];
    const profit = calculateEntryProfit(
      entry,
      currentSnapshot.entryPrice,
      direction
    );
    const weight = entry.margin / 100;
    cumulativeProfitTP += profit * weight;

    const rMultiple = cumulativeProfitTP / referenceRisk;
    ghostTPIndex++;

    paths.push({
      x: currentSnapshotIndex + index + 1,
      y: rMultiple,
      referencePointId: `ghost-tp-${entry.id}`,
      type: "tp",
      isHit: false,
      isGhost: true,
      snapshotId: currentSnapshot.snapshotId,
      tpslEntryIds: [entry.id],
      margins: [entry.margin],
      entryIndices: [ghostTPIndex],
      entryTypes: ["tp"],
    });
  }

  // Generate ghost paths for SLs
  let ghostSLIndex = slIndex;
  let cumulativeProfitSL = cumulativeWeightedProfit;

  for (let index = 0; index < unhitSLs.length; index++) {
    const entry = unhitSLs[index];
    const profit = calculateEntryProfit(
      entry,
      currentSnapshot.entryPrice,
      direction
    );
    const weight = entry.margin / 100;
    cumulativeProfitSL += profit * weight;

    const rMultiple = cumulativeProfitSL / referenceRisk;
    ghostSLIndex++;

    paths.push({
      x: currentSnapshotIndex + index + 1,
      y: rMultiple,
      referencePointId: `ghost-sl-${entry.id}`,
      type: "sl",
      isHit: false,
      isGhost: true,
      snapshotId: currentSnapshot.snapshotId,
      tpslEntryIds: [entry.id],
      margins: [entry.margin],
      entryIndices: [ghostSLIndex],
      entryTypes: ["sl"],
    });
  }

  return paths;
}

/**
 * Calculate progression for all snapshots up to current
 * Returns comprehensive data for each snapshot
 */
export function calculateAllSnapshotsProgression(
  snapshots: SnapshotWithTpsl[],
  direction: "long" | "short",
  currentSnapshotId?: Id<"snapshots">
): ProgressionSnapshotResult[] {
  if (snapshots.length === 0) {
    return [];
  }

  const currentSnapshotIndex = currentSnapshotId
    ? snapshots.findIndex((s) => s.snapshotId === currentSnapshotId)
    : snapshots.length - 1;

  if (currentSnapshotIndex === -1) {
    return [];
  }

  const firstSnapshot = snapshots.find((s) => s.entryPrice);
  if (!firstSnapshot?.entryPrice) {
    return [];
  }

  const referenceRisk = calculateReferenceRisk(
    snapshots,
    firstSnapshot.entryPrice,
    direction
  );

  const results: ProgressionSnapshotResult[] = [];

  for (let i = 0; i <= currentSnapshotIndex; i++) {
    const snapshot = snapshots[i];
    const previousSnapshots = snapshots.slice(0, i);

    const result = calculateSnapshotProgression(
      snapshot,
      previousSnapshots,
      direction,
      referenceRisk
    );

    results.push(result);
  }

  return results;
}

/**
 * Get the current R-multiple value based on hit TP/SL entries
 * Returns the cumulative R-multiple from the last reference point
 */
export function getCurrentRMultiple(
  snapshots: SnapshotWithTpsl[],
  direction: "long" | "short",
  currentSnapshotId?: Id<"snapshots">
): number | null {
  if (snapshots.length === 0) {
    return null;
  }

  const currentSnapshotIndex = currentSnapshotId
    ? snapshots.findIndex((s) => s.snapshotId === currentSnapshotId)
    : snapshots.length - 1;

  if (currentSnapshotIndex === -1) {
    return null;
  }

  const firstSnapshot = snapshots.find((s) => s.entryPrice);
  if (!firstSnapshot?.entryPrice) {
    return null;
  }

  const referenceRisk = calculateReferenceRisk(
    snapshots,
    firstSnapshot.entryPrice,
    direction
  );

  if (referenceRisk === 0) {
    return null;
  }

  let cumulativeWeightedProfit = 0;
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

    for (const entry of hitEntries) {
      const profit = calculateEntryProfit(
        entry,
        snapshot.entryPrice,
        direction
      );
      const weight = entry.margin / 100;
      cumulativeWeightedProfit += profit * weight;
      processedEntryIds.add(entry.id);
    }
  }

  return cumulativeWeightedProfit / referenceRisk;
}
