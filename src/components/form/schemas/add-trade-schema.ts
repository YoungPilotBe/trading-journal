import { TIMEFRAMES } from "@/config/timeframe-order";
import { Id } from "convex/_generated/dataModel";
import { z } from "zod";

// Define the valid timeframes as a union type
export const timeframeSchema = z.enum(TIMEFRAMES);
export const timeframesSchema = timeframeSchema.array();
export const emotionSchema = z.enum([
  "fear",
  "greed",
  "impulsive",
  "calm",
  "revenge",
]);

// Base schema object for all trade setups
const baseTradeSetupObject = {
  asset: z.string(),
  timeframes: timeframesSchema,
  creationTime: z.string(),
  title: z.string().min(1).max(100),
  direction: z.enum(["long", "short"]),
  emotion: emotionSchema,
  riskReward: z.optional(z.number()),
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
export type OrchestratedTradeSetupSchema = z.infer<typeof addTradeSetupSchema>;
export type TimeframesArrayType = z.infer<typeof timeframesSchema>;

export type UnionKeys<T> = T extends T ? keyof T : never;

// Schema for createSnapshot mutation - only the fields it needs
export const createSnapshotSchema = z.object({
  tradeSetupId: z.custom<Id<"trade_setups">>(),
  timeframes: timeframesSchema,
  status: z.enum([
    "idea",
    "watching",
    "executed",
    "reviewed",
    "canceled",
    "closed",
  ]),
  imageId: z.custom<Id<"tradingview_images">>(),
  riskReward: z.optional(z.number()),
  emotion: z.optional(emotionSchema),
});

// Schema for createTradeSetup mutation - only the fields it needs
export const createTradeSetupSchema = z.object({
  asset: z.string(),
  title: z.string().min(1).max(100),
  direction: z.enum(["long", "short"]),
  result: z.enum(["win", "loss", "breakeven"]).optional(),
});

// Schema for updateTradeSetup mutation - only the fields it needs
export const updateTradeSetupSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  direction: z.optional(z.enum(["long", "short"])),
  trade_template: z.custom<Id<"trade_templates">>().optional(),
  result: z.enum(["win", "loss", "breakeven"]).optional(),
});

export const attachTradeSetupSchema = z.object({
  trade_template: z.custom<Id<"trade_templates">>().optional(),
  result: z.enum(["win", "loss", "breakeven"]).optional(),
});

export const updateSnapshotSchema = z.object({
  timeframes: z.optional(timeframesSchema),
  status: z.optional(
    z.enum(["idea", "watching", "executed", "reviewed", "canceled", "closed"])
  ),
  riskReward: z.optional(z.number()),
  emotion: z.optional(emotionSchema),
});

export const tradeDetailsSchema =
  updateTradeSetupSchema.merge(updateSnapshotSchema);

export const attachTradeSchema =
  attachTradeSetupSchema.merge(createSnapshotSchema);

export type AttachTradeSchema = z.infer<typeof attachTradeSchema>;
// Export the inferred types for the new schemas
export type CreateSnapshotData = z.infer<typeof createSnapshotSchema>;
export type CreateTradeSetupData = z.infer<typeof createTradeSetupSchema>;
export type UpdateTradeSetupData = z.infer<typeof updateTradeSetupSchema>;
export type TradeDetailsSchema = z.infer<typeof tradeDetailsSchema>;
