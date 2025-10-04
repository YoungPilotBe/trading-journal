import { TIMEFRAMES } from "@/config/timeframe-order";
import { Id } from "convex/_generated/dataModel";
import { z } from "zod";

// Define the valid timeframes as a union type
const timeframeSchema = z.enum(TIMEFRAMES);
const timeframesSchema = timeframeSchema.array();
// Base schema object for all trade setups
const baseTradeSetupObject = {
  asset: z.string(),
  timeframe: z.optional(timeframeSchema),
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

export type UnionKeys<T> = T extends T ? keyof T : never;

// Schema for createSnapshot mutation - only the fields it needs
export const createSnapshotSchema = z.object({
  tradeSetupId: z.custom<Id<"trade_setups">>(),
  timeframe: timeframeSchema,
  status: z.enum([
    "idea",
    "watching",
    "executed",
    "reviewed",
    "canceled",
    "closed",
  ]),
  imageId: z.custom<Id<"tradingview_images">>(),
  result: z.enum(["win", "loss", "breakeven"]).optional(),
});

// Schema for createTradeSetup mutation - only the fields it needs
export const createTradeSetupSchema = z.object({
  asset: z.string(),
  title: z.string().min(1).max(100),
  direction: z.enum(["long", "short"]),
  riskReward: z.number().nullable(),
  timeframes: timeframesSchema,
  timeframe: timeframeSchema,
  status: z.enum([
    "idea",
    "watching",
    "executed",
    "reviewed",
    "canceled",
    "closed",
  ]),
  result: z.enum(["win", "loss", "breakeven"]).optional(),
  imageId: z.custom<Id<"tradingview_images">>(),
});

// Schema for updateTradeSetup mutation - only the fields it needs
export const updateTradeSetupSchema = z.object({
  id: z.custom<Id<"trade_setups">>(),
  snapshotId: z.custom<Id<"snapshots">>(),
  imageId: z.custom<Id<"tradingview_images">>(),
  title: z.string().min(1).max(100).optional(),
  direction: z.enum(["long", "short"]).optional(),
  trade_template: z.custom<Id<"trade_templates">>().optional(),
  riskReward: z.number().nullable().optional(),
  timeframes: timeframesSchema.optional(),
});

// Export the inferred types for the new schemas
export type CreateSnapshotData = z.infer<typeof createSnapshotSchema>;
export type CreateTradeSetupData = z.infer<typeof createTradeSetupSchema>;
export type UpdateTradeSetupData = z.infer<typeof updateTradeSetupSchema>;
