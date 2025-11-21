import { z } from "zod";

// Entry schema for individual TP/SL entries
const tpslEntrySchema = z.object({
  price: z
    .union([
      z.number().positive("Price must be a positive number"),
      z.undefined(),
    ])
    .optional(),
  weight: z
    .number()
    .min(0, "Weight must be at least 0")
    .max(100, "Weight cannot exceed 100"),
});

// Array schema with total weight validation
const tpslArraySchema = z
  .array(tpslEntrySchema)
  .refine(
    (data) => {
      // Prices must be unique within the array (only check defined prices)
      const prices = data
        .map((entry) => entry.price)
        .filter((price): price is number => price !== undefined);
      return new Set(prices).size === prices.length;
    },
    {
      message: "Prices must be unique within each section",
    }
  )
  .refine(
    (data) => {
      // If an entry has weight > 0, it must have a valid price set
      const allEntriesWithWeightHavePrice = data.every((entry) => {
        if (entry.weight > 0) {
          return entry.price !== undefined && entry.price > 0;
        }
        return true; // Entries with weight 0 don't need a price
      });
      return allEntriesWithWeightHavePrice;
    },
    {
      message: "Entries with weight must have a price set",
    }
  )
  .refine(
    (data) => {
      // Only validate total weight if all entries have weights > 0
      // This prevents errors when adding new entries with weight 0
      const allWeightsFilled = data.every(
        (entry) => entry.weight > 0 || entry.weight === undefined
      );
      if (!allWeightsFilled) {
        return true; // Skip validation if any entry has weight 0
      }
      // Total weight of the array must equal exactly 100%
      const totalWeight = data.reduce((sum, entry) => sum + entry.weight, 0);
      return totalWeight === 100;
    },
    {
      message: "Total weight must equal exactly 100%",
    }
  );

// Function to create TP/SL form schema with direction-based validation
export function createTpslFormSchema(direction: "long" | "short") {
  return z
    .object({
      takeProfits: tpslArraySchema,
      stopLosses: tpslArraySchema,
    })
    .refine(
      (data) => {
        // At least one complete entry required (with both price and weight set)
        const hasCompleteTP = data.takeProfits.some(
          (entry) =>
            entry.price !== undefined && entry.price > 0 && entry.weight > 0
        );
        const hasCompleteSL = data.stopLosses.some(
          (entry) =>
            entry.price !== undefined && entry.price > 0 && entry.weight > 0
        );
        return hasCompleteTP || hasCompleteSL;
      },
      {
        message:
          "At least one complete entry (with both price and weight) is required",
      }
    )
    .superRefine((data, ctx) => {
      // Filter out entries with invalid or undefined prices for validation
      const validTPPrices = data.takeProfits
        .map((entry) => entry.price)
        .filter((price): price is number => price !== undefined && price > 0);
      const validSLPrices = data.stopLosses
        .map((entry) => entry.price)
        .filter((price): price is number => price !== undefined && price > 0);

      // Skip validation if either array has no valid prices
      if (validTPPrices.length === 0 || validSLPrices.length === 0) {
        return;
      }

      const minTP = Math.min(...validTPPrices);
      const maxTP = Math.max(...validTPPrices);
      const minSL = Math.min(...validSLPrices);
      const maxSL = Math.max(...validSLPrices);

      if (direction === "long") {
        // For longs: All TP prices must be higher than all SL prices
        // This means: min TP > max SL
        if (minTP <= maxSL) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "For long positions, all Take Profit prices must be higher than all Stop Loss prices",
            path: ["takeProfits"],
          });
        }
      } else if (direction === "short") {
        // For shorts: All TP prices must be lower than all SL prices
        // This means: max TP < min SL
        if (maxTP >= minSL) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "For short positions, all Take Profit prices must be lower than all Stop Loss prices",
            path: ["takeProfits"],
          });
        }
      }
    });
}

// Export TypeScript types
export type TPSLEntry = z.infer<typeof tpslEntrySchema>;
export type TPSLFormData = z.infer<ReturnType<typeof createTpslFormSchema>>;
