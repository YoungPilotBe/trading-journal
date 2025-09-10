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
  })
    .index("by_source", ["source"])
    .index("by_uploaded_at", ["uploadedAt"]),
});
