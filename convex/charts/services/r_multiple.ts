/**
 * Calculates the weighted R-multiple based on entry price, take profits, and stop losses.
 *
 * Formula uses weighted averages:
 * - For long positions:
 *   - Weighted avg profit = sum((TP_price - Entry_price) * margin) / 100
 *   - Weighted avg risk = sum((Entry_price - SL_price) * margin) / 100
 *   - R = weighted_avg_profit / weighted_avg_risk
 *
 * - For short positions:
 *   - Weighted avg profit = sum((Entry_price - TP_price) * margin) / 100
 *   - Weighted avg risk = sum((SL_price - Entry_price) * margin) / 100
 *   - R = weighted_avg_profit / weighted_avg_risk
 *
 * @param entryPrice - The entry price
 * @param takeProfits - Array of take profit entries with price and margin
 * @param stopLosses - Array of stop loss entries with price and margin
 * @param direction - Trade direction ("long" or "short")
 * @returns The calculated R-multiple, or undefined if calculation cannot be performed
 */
export function calculateRMultiple(
  entryPrice: number | undefined,
  takeProfits: Array<{ price: number; margin: number }>,
  stopLosses: Array<{ price: number; margin: number }>,
  direction: "long" | "short"
): number | undefined {
  // Need entry price and at least one valid TP or SL to calculate
  if (!entryPrice || entryPrice <= 0) {
    return undefined;
  }

  // Filter valid entries (with price > 0 and margin > 0)
  const validTPs = takeProfits.filter(
    (tp) => tp.price !== undefined && tp.price > 0 && tp.margin > 0
  );
  const validSLs = stopLosses.filter(
    (sl) => sl.price !== undefined && sl.price > 0 && sl.margin > 0
  );

  // Need at least one valid TP or SL
  if (validTPs.length === 0 && validSLs.length === 0) {
    return undefined;
  }

  if (direction === "long") {
    // For long: need at least one SL to calculate risk
    if (validSLs.length === 0) {
      return undefined;
    }

    // Calculate weighted profit (from TPs): sum((profit * margin) / 100)
    const weightedProfit = validTPs.reduce(
      (sum, tp) => sum + (tp.price! - entryPrice) * (tp.margin / 100),
      0
    );

    // Calculate weighted risk (from SLs): sum((risk * margin) / 100)
    const weightedRisk = validSLs.reduce(
      (sum, sl) => sum + (entryPrice - sl.price!) * (sl.margin / 100),
      0
    );

    if (weightedRisk <= 0) {
      return undefined;
    }

    return weightedProfit / weightedRisk;
  } else {
    // For short: need at least one SL to calculate risk
    if (validSLs.length === 0) {
      return undefined;
    }

    // Calculate weighted profit (from TPs): sum((profit * margin) / 100)
    const weightedProfit = validTPs.reduce(
      (sum, tp) => sum + (entryPrice - tp.price!) * (tp.margin / 100),
      0
    );

    // Calculate weighted risk (from SLs): sum((risk * margin) / 100)
    const weightedRisk = validSLs.reduce(
      (sum, sl) => sum + (sl.price! - entryPrice) * (sl.margin / 100),
      0
    );

    if (weightedRisk <= 0) {
      return undefined;
    }

    return weightedProfit / weightedRisk;
  }
}
