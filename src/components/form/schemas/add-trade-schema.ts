import { TIMEFRAMES } from "@/config/timeframe-order";
import { Id } from "convex/_generated/dataModel";
import { z } from "zod";
import { TPSLFormData, createTpslFormSchema } from "./tpsl-schema";

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

const statusEnum = z.enum([
  "idea",
  "watching",
  "executed",
  "reviewed",
  "canceled",
  "closed",
]);

const resultEnum = z.enum(["win", "loss", "breakeven"]);

// Base schema with all possible fields
const baseTradeFormSchema = z.object({
  asset: z.string(),
  timeframes: timeframesSchema,
  creationTime: z.string(),
  title: z.string().min(1).max(100),
  direction: z.enum(["long", "short"]),
  emotion: emotionSchema,
  rMultiple: z.optional(z.number()),
  status: statusEnum,
  result: resultEnum.optional(),
  // TP/SL configuration (optional, validated against direction)
  tpsl: z.custom<TPSLFormData>().optional(),
  // Additional fields for mutations
  trade_template: z.custom<Id<"trade_templates">>().optional(),
  imageId: z.custom<Id<"tradingview_images">>().optional(),
  tradeSetupId: z.custom<Id<"trade_setups">>().optional(),
});

// Discriminated union for form validation - result required when status is closed
const closedTradeSetupSchema = baseTradeFormSchema
  .omit({ status: true, result: true })
  .extend({
    status: z.literal("closed"),
    result: resultEnum,
  });

const otherStatusTradeSetupSchema = baseTradeFormSchema
  .omit({ status: true, result: true })
  .extend({
    status: z.enum(["idea", "watching", "executed", "reviewed", "canceled"]),
  });

// Base schema with TP/SL validation
const addTradeSetupSchemaBase = z.discriminatedUnion("status", [
  closedTradeSetupSchema,
  otherStatusTradeSetupSchema,
]);

// Add TP/SL validation against direction
export const addTradeSetupSchema = addTradeSetupSchemaBase.superRefine(
  (data, ctx) => {
    // Only validate TP/SL if it exists
    if (!data.tpsl) {
      return;
    }

    // Validate TP/SL data against the current direction
    const tpslSchema = createTpslFormSchema(data.direction);
    const result = tpslSchema.safeParse(data.tpsl);

    if (!result.success) {
      // Add validation errors to the tpsl field
      result.error.errors.forEach((error) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error.message,
          path: ["tpsl", ...(error.path || [])],
        });
      });
    }
  }
);

// Derived schemas using composition
// Snapshot schema without imageId (for createTradeSetupWithSnapshot)
const snapshotSchemaWithoutImageId = baseTradeFormSchema.pick({
  timeframes: true,
  status: true,
  emotion: true,
  rMultiple: true,
});

// Snapshot schema with imageId (for createSnapshot mutation)
export const createSnapshotSchema = snapshotSchemaWithoutImageId.extend({
  imageId: z.custom<Id<"tradingview_images">>(),
});

export const createTradeSetupSchema = baseTradeFormSchema.pick({
  asset: true,
  title: true,
  direction: true,
  result: true,
});

export const updateTradeSetupSchema = baseTradeFormSchema
  .pick({
    title: true,
    direction: true,
    result: true,
    trade_template: true,
  })
  .partial();

export const updateSnapshotSchema = baseTradeFormSchema
  .pick({
    timeframes: true,
    status: true,
    rMultiple: true,
    emotion: true,
  })
  .partial();

export const attachTradeSetupSchema = baseTradeFormSchema
  .pick({
    trade_template: true,
    result: true,
  })
  .partial();

// Merged schemas
export const tradeDetailsSchema =
  updateTradeSetupSchema.merge(updateSnapshotSchema);

export const attachTradeSchema =
  attachTradeSetupSchema.merge(createSnapshotSchema);

// Transformed schemas that automatically split data
// For addTradeSetupSchema, imageId is passed separately to the mutation
export function splitAddTradeSetupData<
  T extends z.infer<typeof addTradeSetupSchema>,
>(data: T) {
  // Use schema without imageId since it's passed separately to the mutation
  const snapshot = snapshotSchemaWithoutImageId.parse({
    timeframes: data.timeframes,
    status: data.status,
    emotion: data.emotion,
    rMultiple: data.rMultiple,
  });
  const tradeSetup = createTradeSetupSchema.parse(data);
  return { snapshot, tradeSetup };
}

export const tradeDetailsSchemaWithSplit = tradeDetailsSchema.transform(
  (data) => {
    const tradeSetup = updateTradeSetupSchema.parse(data);
    const snapshot = updateSnapshotSchema.parse(data);
    return { tradeSetup, snapshot };
  }
);

export function splitAttachTradeData<
  T extends z.infer<typeof attachTradeSchema>,
>(data: T, imageId: Id<"tradingview_images">) {
  const tradeSetup = attachTradeSetupSchema.parse(data);
  const snapshot = createSnapshotSchema.parse({ ...data, imageId });
  return { tradeSetup, snapshot };
}

// Export the inferred types
export type OrchestratedTradeSetupSchema = z.infer<typeof addTradeSetupSchema>;
export type TimeframesArrayType = z.infer<typeof timeframesSchema>;
export type UnionKeys<T> = T extends T ? keyof T : never;
export type AttachTradeSchema = z.infer<typeof attachTradeSchema>;
export type CreateSnapshotData = z.infer<typeof createSnapshotSchema>;
export type CreateTradeSetupData = z.infer<typeof createTradeSetupSchema>;
export type UpdateTradeSetupData = z.infer<typeof updateTradeSetupSchema>;
export type TradeDetailsSchema = z.infer<typeof tradeDetailsSchema>;
