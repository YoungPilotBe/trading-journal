import { TIMEFRAMES } from "@/config/timeframe-order";
import { z } from "zod";

// Define the valid timeframes as a union type
const timeframeSchema = z.enum(TIMEFRAMES);
const timeframesSchema = timeframeSchema.array();
// Base schema object for all trade setups
const baseTradeSetupObject = {
  asset: z.string(),
  timeframe: timeframeSchema,
  creationTime: z.string(),
  title: z.string().min(1).max(100),
  direction: z.enum(["long", "short"]),
  riskReward: z.number().nullable(),
  timeframes: timeframesSchema,
};

// Object for when status is 'closed' - result is required
const closedTradeSetupObject = {
  ...baseTradeSetupObject,
  status: z.literal("closed"),
  result: z.enum(["win", "loss", "breakeven"]),
};

// Object for all other statuses - no result field at all
const otherStatusTradeSetupObject = {
  ...baseTradeSetupObject,
  status: z.enum(["idea", "watching", "executed", "reviewed", "canceled"]),
  // Note: result is intentionally omitted here
};

// Convert objects to Zod schemas
const closedTradeSetupSchema = z.object(closedTradeSetupObject);
const otherStatusTradeSetupSchema = z.object(otherStatusTradeSetupObject);

// Discriminated union based on status
export const addTradeSetupSchema = z.discriminatedUnion("status", [
  closedTradeSetupSchema,
  otherStatusTradeSetupSchema,
]);

// Export the inferred types
export type AddTradeSetupSchema = z.infer<typeof addTradeSetupSchema>;
export type TimeframesArrayType = z.infer<typeof timeframesSchema>;
