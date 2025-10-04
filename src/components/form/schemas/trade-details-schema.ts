import { Doc, Id } from "convex/_generated/dataModel";
import { z } from "zod";

// Define base schema with common fields
const baseSchema = z.object({
  asset: z.string(),
  creationTime: z.string(),
  title: z.string().nullable(),
  direction: z.enum(["long", "short"]),
  riskReward: z.number().nullable(),
  timeframes: z.array(z.string()),
  status: z.enum([
    "idea",
    "watching",
    "executed",
    "reviewed",
    "canceled",
    "closed",
  ]),
  result: z.enum(["win", "loss", "breakeven"]).optional().nullable(),
});

// Extend with trade_template field that's specific to trade details
export const tradeDetailsSchema = baseSchema.extend({
  trade_template: z.custom<Id<"trade_templates">>().optional(),
  notes: z.array(z.any()).optional(),
});

export type TradeDetailsSchema = z.infer<typeof tradeDetailsSchema>;

// Type for existing data used in default values
interface TradeDetailsExistingData {
  existingTradeSetup?: Doc<"trade_setups"> | null;
  existingSnapshot?: Doc<"snapshots"> | null;
}

// Function to create default values based on existing data
export const createTradeDetailsDefaultValues = (
  existingData?: TradeDetailsExistingData
): TradeDetailsSchema => {
  return {
    asset: existingData?.existingTradeSetup?.asset || "",
    creationTime: existingData?.existingTradeSetup?._creationTime
      ? new Date(existingData.existingTradeSetup._creationTime).toLocaleString()
      : "",
    title: existingData?.existingTradeSetup?.title || null,
    trade_template:
      existingData?.existingTradeSetup?.trade_template || undefined,
    status: existingData?.existingSnapshot?.status || "idea",
    direction: existingData?.existingTradeSetup?.direction || "long",
    riskReward: existingData?.existingTradeSetup?.riskReward || null,
    timeframes: existingData?.existingTradeSetup?.timeframes || ["4h"],
    result: existingData?.existingTradeSetup?.result || null,
  };
};
