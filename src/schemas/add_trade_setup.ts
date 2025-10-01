import { Timeframe, timeframeOrder } from "@/config/timeframe-order";
import { Id } from "convex/_generated/dataModel";
import z from "zod";

export const addTradeSetupSchema = z.object({
  title: z.nullable(
    z
      .string()
      .min(1, "Title is required")
      .max(100, "Title must be less than 100 characters")
  ),
  status: z.enum([
    "idea",
    "watching",
    "executed",
    "closed",
    "reviewed",
    "canceled",
  ]),
  direction: z.enum(["long", "short"]),
  trade_template: z.custom<Id<"trade_templates">>(),
  riskReward: z.nullable(
    z.number({ message: "Risk reward must be a number, e.g. 5.3" })
  ),
  timeframes: z.array(
    z
      .string()
      .refine(
        (tf) => timeframeOrder.includes(tf as Timeframe),
        "Invalid timeframe. Must be one of: 1m, 2m, 3m, 5m, 6m, 10m, 12m, 15m, 20m, 24m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 18h, D, 2D, 3D, 4D, 5D, 6D, W, 2W, M"
      )
  ),
});
