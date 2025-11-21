import { Timeframe } from "@/config/timeframe-order";
import { Doc } from "convex/_generated/dataModel";
import React from "react";
import { TPSLFormInput } from "./schemas/tpsl-schema";

type TpslArrayName = "takeProfits" | "stopLosses";

export function oneOf<T>(input: T): T {
  return input;
}

/**
 * Adds a timeframe to the timeframes array if it's not already included.
 * Handles null/undefined inputs gracefully and ensures no duplicates.
 *
 * @param timeframes - The existing timeframes array (can be null/undefined)
 * @param timeframe - The timeframe to add (can be null/undefined)
 * @returns A new array with the timeframe added if it wasn't already present
 */
export function addTimeframeToTimeframes(
  timeframes: Timeframe[] | null | undefined,
  timeframe?: Timeframe | null
): Timeframe[] {
  // Normalize the existing timeframes array
  const currentTimeframes = Array.isArray(timeframes) ? timeframes : [];

  // Return early if no timeframe to add or if it's empty/whitespace
  if (!timeframe || timeframe.trim() === "") {
    return currentTimeframes;
  }

  // Trim the timeframe to handle whitespace
  const trimmedTimeframe = timeframe.trim() as Timeframe;

  // Only add if not already included (case-sensitive comparison)
  if (!currentTimeframes.includes(trimmedTimeframe)) {
    return [...currentTimeframes, trimmedTimeframe];
  }

  // Return the existing array if timeframe is already included
  return currentTimeframes;
}

export const transformTpslEntriesToFormInput = (
  entries: Doc<"tpsl_entries">[],
  entryPrice?: number
): TPSLFormInput | undefined => {
  if (!entries || entries.length === 0) {
    return undefined;
  }

  // Preserve ALL fields from database documents
  const takeProfits = entries
    .filter((entry) => entry.type === "take_profit")
    .map((entry) => ({
      price: entry.price,
      margin: entry.margin,
      _id: entry._id,
      snapshotId: entry.snapshotId,
      type: entry.type,
      isHit: entry.isHit,
      hitSnapshotId: entry.hitSnapshotId,
      hitAt: entry.hitAt,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

  const stopLosses = entries
    .filter((entry) => entry.type === "stop_loss")
    .map((entry) => ({
      price: entry.price,
      margin: entry.margin,
      _id: entry._id,
      snapshotId: entry.snapshotId,
      type: entry.type,
      isHit: entry.isHit,
      hitSnapshotId: entry.hitSnapshotId,
      hitAt: entry.hitAt,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

  // Return undefined if both arrays are empty
  if (takeProfits.length === 0 && stopLosses.length === 0) {
    return undefined;
  }

  // Always return a structure with arrays, even if empty (with default placeholder)
  return {
    entryPrice: entryPrice,
    takeProfits:
      takeProfits.length > 0
        ? takeProfits
        : [{ price: undefined, margin: 100 }],
    stopLosses:
      stopLosses.length > 0 ? stopLosses : [{ price: undefined, margin: 100 }],
  };
};

/**
 * Calculates the leftover margin available for a specific entry in a TP/SL array.
 * This excludes the current entry's margin from the calculation.
 */
export function calculateLeftoverMargin(
  array: TPSLFormInput[TpslArrayName],
  currentIndex: number
): number {
  const otherMarginsSum = array.reduce(
    (sum, entry, index) =>
      index !== currentIndex ? sum + (entry.margin || 0) : sum,
    0
  );
  return Math.max(0, 100 - otherMarginsSum);
}

/**
 * Calculates the leftover margin available for a new entry in a TP/SL array.
 */
export function calculateLeftoverMarginForNewEntry(
  array: TPSLFormInput[TpslArrayName]
): number {
  const totalMargin = array.reduce(
    (sum, entry) => sum + (entry.margin || 0),
    0
  );
  return Math.max(0, 100 - totalMargin);
}

/**
 * Calculates the total margin used in a TP/SL array.
 */
export function calculateTotalMargin(
  array: TPSLFormInput[TpslArrayName]
): number {
  return array.reduce((sum, entry) => sum + (entry.margin || 0), 0);
}

/**
 * Handles margin change with auto-adjustment to prevent exceeding 100% total margin.
 */
export function handleMarginChange(
  array: TPSLFormInput[TpslArrayName],
  index: number,
  value: number,
  onChange: (value: number) => void,
  event: React.ChangeEvent<HTMLInputElement>
): void {
  const leftover = calculateLeftoverMargin(array, index);
  const finalValue = Math.min(value, leftover);

  onChange(finalValue);

  if (value > leftover) {
    // Use setTimeout to ensure the value is set before blurring
    setTimeout(() => {
      event.target.blur();
    }, 0);
  }
}
