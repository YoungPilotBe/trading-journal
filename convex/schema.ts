import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tradingview_images: defineTable({
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    contentType: v.string(),
    source: v.string(),
    asset: v.string(),
    onboarding_complete: v.boolean(),
    uploadedAt: v.number(),
    // Foreign key to link image to trade setup
    tradeSetupId: v.optional(v.id("trade_setups")),
  })
    .index("by_source", ["source"])
    .index("by_uploaded_at", ["uploadedAt"])
    .index("by_trade_setup", ["tradeSetupId"]),

  trade_setups: defineTable({
    // Basic trade information
    title: v.string(),
    asset: v.string(),

    // Trade direction and status
    direction: v.union(v.literal("long"), v.literal("short")),
    status: v.union(
      v.literal("idea"),
      v.literal("watching"),
      v.literal("executed"),
      v.literal("closed"),
      v.literal("reviewed")
    ),

    // Risk management
    riskReward: v.optional(v.string()), // Format: "3:2" or "3.1:2.5"

    // Timeframes being watched
    timeframes: v.array(v.string()),

    // Timeframe couples
    timeframeTagCouples: v.optional(v.any()),

    // Strategy tags - JSON object containing strategy form data
    tags: v.optional(v.any()),

    // Foreign key to link trade setup to the triggering image
    imageId: v.optional(v.id("tradingview_images")),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_status", ["status"])
    .index("by_asset", ["asset"])
    .index("by_direction", ["direction"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_image_id", ["imageId"]),
});
