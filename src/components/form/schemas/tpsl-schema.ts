import { Id } from "convex/_generated/dataModel";
import { z } from "zod";

// Entry schema for individual TP/SL entries
// Hybrid schema: supports both basic user input (price, margin) and full database documents
const tpslEntrySchema = z.object({
  // Required fields for form validation
  price: z
    .union([
      z.number().positive("Price must be a positive number"),
      z.undefined(),
    ])
    .optional(),
  margin: z
    .number()
    .min(0, "Margin must be at least 0")
    .max(100, "Margin cannot exceed 100"),
  // Optional database fields (present when editing existing entries)
  _id: z.custom<Id<"tpsl_entries">>().optional(),
  snapshotId: z.custom<Id<"snapshots">>().optional(),
  type: z.enum(["take_profit", "stop_loss"]).optional(),
  isHit: z.boolean().optional(),
  hitSnapshotId: z.custom<Id<"snapshots">>().optional(),
  hitAt: z.number().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

// Array schema with total margin validation
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
      // If an entry has margin > 0, it must have a valid price set
      const allEntriesWithMarginHavePrice = data.every((entry) => {
        if (entry.margin > 0) {
          return entry.price !== undefined && entry.price > 0;
        }
        return true; // Entries with margin 0 don't need a price
      });
      return allEntriesWithMarginHavePrice;
    },
    {
      message: "Entries with margin must have a price set",
    }
  )
  .refine(
    (data) => {
      // Only validate total margin if all entries have margins > 0
      // This prevents errors when adding new entries with margin 0
      const allMarginsFilled = data.every(
        (entry) => entry.margin > 0 || entry.margin === undefined
      );
      if (!allMarginsFilled) {
        return true; // Skip validation if any entry has margin 0
      }
      // Total margin of the array must equal exactly 100%
      const totalMargin = data.reduce((sum, entry) => sum + entry.margin, 0);
      return totalMargin === 100;
    },
    {
      message: "Total margin must equal exactly 100%",
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
        // At least one complete entry required (with both price and margin set)
        const hasCompleteTP = data.takeProfits.some(
          (entry) =>
            entry.price !== undefined && entry.price > 0 && entry.margin > 0
        );
        const hasCompleteSL = data.stopLosses.some(
          (entry) =>
            entry.price !== undefined && entry.price > 0 && entry.margin > 0
        );
        return hasCompleteTP || hasCompleteSL;
      },
      {
        message:
          "At least one complete entry (with both price and margin) is required",
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
    })
    .transform((data) => {
      // Filter out entries with undefined prices AFTER validation passes
      // This ensures the output only contains entries with valid prices
      // Preserve all database fields when filtering
      return {
        takeProfits: data.takeProfits.filter(
          (entry): entry is typeof entry & { price: number } =>
            entry.price !== undefined && entry.price > 0
        ),
        stopLosses: data.stopLosses.filter(
          (entry): entry is typeof entry & { price: number } =>
            entry.price !== undefined && entry.price > 0
        ),
      };
    });
}

// Input type for form editing (allows undefined prices for placeholders)
export type TPSLFormInput = z.input<ReturnType<typeof createTpslFormSchema>>;

// Output type after validation (only entries with valid prices)
export type TPSLFormData = z.infer<ReturnType<typeof createTpslFormSchema>>;

// Export TypeScript types
export type TPSLEntry = z.infer<typeof tpslEntrySchema>;
