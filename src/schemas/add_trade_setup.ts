import { Timeframe, timeframeOrder } from "@/config/timeframe-order";
import z from "zod";

export const addTradeSetupSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  status: z.enum(["idea", "watching", "executed", "closed", "reviewed"]),
  direction: z.enum(["long", "short"]),
  riskReward: z
    .union([z.string(), z.literal("")]) // accept empty string
    .refine((value) => {
      if (!value || value.trim() === "") return true;
      const regex = /^\d{1,2}(\.\d)?:\d{1,2}(\.\d)?$/;
      return regex.test(value.trim());
    }, "Risk/reward must be in format like '5:3' or '3.1:2' (max 1 decimal place)"),
  timeframes: z.array(
    z
      .string()
      .refine(
        (tf) => timeframeOrder.includes(tf as Timeframe),
        "Invalid timeframe. Must be one of: 1m, 2m, 3m, 5m, 6m, 10m, 12m, 15m, 20m, 24m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 18h, D, 2D, 3D, 4D, 5D, 6D, W, 2W, M"
      )
  ),
});
