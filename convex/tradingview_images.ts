import { v } from "convex/values";
import { parseFilename } from "../src/lib/utils";
import { mutation, query } from "./_generated/server";

export const getImage = query({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the image metadata
    const image_metadata = await ctx.db
      .query("tradingview_images")
      .filter((q) => q.eq(q.field("_id"), args.id))
      .first();

    if (!image_metadata) {
      return null;
    }

    // Get the storage URL for the image
    const url = await ctx.storage.getUrl(image_metadata.storageId);

    return {
      ...image_metadata,
      url,
    };
  },
});

// Store file metadata and get storage URL for upload
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Generate a storage upload URL that expires in 1 hour
    return await ctx.storage.generateUploadUrl();
  },
});

// Save file metadata after successful upload
export const saveFileMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    contentType: v.string(),
    source: v.optional(v.string()), // e.g., "tradingview", "discord"
    uploadedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { asset } = parseFilename(args.fileName);

    const fileId = await ctx.db.insert("tradingview_images", {
      storageId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      contentType: args.contentType,
      source: args.source || "unknown",
      asset,
      onboarding_complete: false,
      uploadedAt: args.uploadedAt,
    });

    return fileId;
  },
});

// Function for retrieving the latest images which have onboarding_complete set to false
export const getToBeOnboardedImages = query({
  args: {
    asset: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("tradingview_images")
      .filter((q) => q.eq(q.field("onboarding_complete"), false));

    // Filter by asset if provided
    if (args.asset) {
      query = query.filter((q) => q.eq(q.field("asset"), args.asset));
    }

    // Order by uploadedAt descending to get latest first
    const files = await query.order("desc").collect();

    return files;
  },
});
