import { Doc, Id } from "convex/_generated/dataModel";
import { z } from "zod";
import {
  emotionSchema,
  TimeframesArrayType,
  timeframesSchema,
} from "./add-trade-schema";

// Define base schema with common fields
const baseSchema = z.object({
  asset: z.string(),
  title: z.optional(z.string()),
  direction: z.enum(["long", "short"]),
  timeframes: timeframesSchema,
  status: z.enum([
    "idea",
    "watching",
    "executed",
    "reviewed",
    "canceled",
    "closed",
  ]),
  result: z.enum(["win", "loss", "breakeven"]).optional(),
  emotion: emotionSchema.nullable(),
  riskReward: z.optional(z.number()),
});

// Extend with trade_template field that's specific to trade details
export const tradeDetailsSchema = baseSchema.extend({
  trade_template: z.custom<Id<"trade_templates">>().optional(),
  notes: z.array(z.any()).optional(),
  emotion: z.optional(emotionSchema.optional()),
});

export type TradeDetailsSchema = z.infer<typeof tradeDetailsSchema>;

// Type for existing data used in default values
interface TradeDetailsExistingData {
  existingTradeSetup: Doc<"trade_setups">;
  existingSnapshot: Doc<"snapshots">;
}

// Function to create default values based on existing data
export const createTradeDetailsDefaultValues = (
  existingData: TradeDetailsExistingData
): TradeDetailsSchema => {
  return {
    asset: existingData.existingTradeSetup.asset,
    title: existingData.existingTradeSetup.title,
    trade_template: existingData.existingTradeSetup.trade_template,
    status: existingData.existingSnapshot.status || "idea",
    direction: existingData.existingTradeSetup.direction || "long",
    timeframes:
      (existingData.existingTradeSetup.timeframes as TimeframesArrayType) ||
      (["4h"] as TimeframesArrayType),
    result: existingData.existingTradeSetup.result,
    riskReward: existingData.existingSnapshot.riskReward,
  };
};
