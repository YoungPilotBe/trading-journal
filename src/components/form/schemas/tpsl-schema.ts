import { z } from "zod";

// Entry schema for individual TP/SL entries
const tpslEntrySchema = z.object({
  price: z.number().positive("Price must be a positive number"),
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
      // Prices must be unique within the array
      const prices = data.map((entry) => entry.price);
      return new Set(prices).size === prices.length;
    },
    {
      message: "Prices must be unique within each section",
    }
  )
  .refine(
    (data) => {
      // Total weight of the array must not exceed 100%
      const totalWeight = data.reduce((sum, entry) => sum + entry.weight, 0);
      return totalWeight <= 100;
    },
    {
      message: "Total weight cannot exceed 100%",
    }
  );

// Main TP/SL form schema
export const tpslFormSchema = z
  .object({
    takeProfits: tpslArraySchema,
    stopLosses: tpslArraySchema,
  })
  .refine(
    (data) => {
      // At least one entry required in TP or SL
      return data.takeProfits.length > 0 || data.stopLosses.length > 0;
    },
    {
      message: "At least one Take Profit or Stop Loss entry is required",
    }
  );

// Export TypeScript types
export type TPSLEntry = z.infer<typeof tpslEntrySchema>;
export type TPSLFormData = z.infer<typeof tpslFormSchema>;
