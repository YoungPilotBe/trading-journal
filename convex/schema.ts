import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { emotionUnion, statusUnion } from "./constants/unions";

export default defineSchema({
  tradingview_images: defineTable({
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    timeframe: v.optional(v.string()),
    contentType: v.string(),
    source: v.string(),
    asset: v.string(),
    onboarding_complete: v.boolean(),
    uploadedAt: v.number(),
    // Foreign key to link image to trade setup
    snapshotId: v.optional(v.id("snapshots")),
  })
    .index("by_source", ["source"])
    .index("by_uploaded_at", ["uploadedAt"])
    .index("by_snapshot", ["snapshotId"]),

  drawings: defineTable({
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    contentType: v.string(),
    uploadedAt: v.number(),
    offsetY: v.optional(v.number()),

    // One-to-one relationship with trade_templates
    tradeTemplateId: v.optional(v.id("trade_templates")),
  })
    .index("by_uploaded_at", ["uploadedAt"])
    .index("by_trade_template", ["tradeTemplateId"]),

  trade_templates: defineTable({
    document: v.any(),

    title: v.string(),

    // One-to-one relationship with drawings
    drawingId: v.optional(v.id("drawings")),

    // External image URL (for AI-searched images)
    drawingUrl: v.optional(v.string()),

    // One-to-many relationship with trade_setups
    tradeSetupIds: v.optional(v.array(v.id("trade_setups"))),

    // Image zoom mode: "cover" (offsetable) or "contain" (fits container, no offset)
    zoomMode: v.optional(v.union(v.literal("cover"), v.literal("contain"))),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_drawing", ["drawingId"]),
  notes: defineTable({
    document: v.optional(v.any()),

    title: v.optional(v.string()),

    // One-to-many relationship: many notes can belong to one snapshot
    snapshotId: v.id("snapshots"),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_snapshot", ["snapshotId"]),

  trade_setups: defineTable({
    // Basic trade information
    title: v.string(),
    asset: v.string(),

    // Trade direction
    direction: v.union(v.literal("long"), v.literal("short")),

    trade_template: v.optional(v.id("trade_templates")),

    // Win/loss
    result: v.optional(
      v.union(v.literal("win"), v.literal("loss"), v.literal("breakeven"))
    ),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_asset", ["asset"])
    .index("by_direction", ["direction"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_trade_template", ["trade_template"]),

  snapshots: defineTable({
    // Reference to the trade setup this snapshot belongs to
    tradeSetupId: v.id("trade_setups"),

    // Trade status at the time of this snapshot
    status: statusUnion,

    tags: v.optional(v.any()),

    // Complete tree state configuration (expanded keys, selected nodes, etc.)
    tags_config: v.optional(v.any()),

    // Timeframes for this snapshot
    timeframes: v.optional(v.array(v.string())),

    // Foreign key to link snapshot to the triggering image
    imageId: v.optional(v.id("tradingview_images")),

    // Timestamp when this snapshot was created
    createdAt: v.number(),

    rMultiple: v.optional(v.number()),

    emotion: v.optional(emotionUnion),

    // Entry price for TP/SL configuration
    entryPrice: v.optional(v.number()),
  })
    .index("by_trade_setup", ["tradeSetupId"])
    .index("by_created_at", ["createdAt"])
    .index("by_status", ["status"])
    .index("by_image_id", ["imageId"])
    .index("by_trade_setup_and_created_at", ["tradeSetupId", "createdAt"]),

  base_titles: defineTable({
    title: v.string(),
    createdAt: v.number(),
  })
    .index("by_title", ["title"])
    .index("by_created_at", ["createdAt"]),

  tpsl_entries: defineTable({
    // Reference to the snapshot this TP/SL entry belongs to
    snapshotId: v.id("snapshots"),

    // Type of entry: take_profit, stop_loss, or entry_price
    type: v.union(
      v.literal("take_profit"),
      v.literal("stop_loss"),
      v.literal("entry_price")
    ),

    // Price and margin for this entry
    price: v.number(),
    margin: v.number(),

    // Hit tracking
    isHit: v.boolean(),
    hitSnapshotId: v.optional(v.id("snapshots")),
    hitAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_snapshot", ["snapshotId"]),
});
