import { Timeframe } from "@/config/timeframe-order";

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
