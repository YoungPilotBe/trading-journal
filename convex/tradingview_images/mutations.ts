import { ConvexError, v } from "convex/values";
import { parseFilename } from "../../src/lib/utils";
import { mutation } from "../_generated/server";

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
    timeframe: v.optional(v.string()),
    fileName: v.string(),
    fileSize: v.number(),
    contentType: v.string(),
    source: v.optional(v.string()),
    uploadedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { asset } = parseFilename(args.fileName);

    const fileId = await ctx.db.insert("tradingview_images", {
      storageId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      timeframe: args.timeframe,
      contentType: args.contentType,
      source: args.source || "unknown",
      asset,
      onboarding_complete: false,
      uploadedAt: args.uploadedAt,
    });

    return fileId;
  },
});

// Delete an image by its _id
export const deleteImage = mutation({
  args: {
    id: v.id("tradingview_images"),
  },
  handler: async (ctx, args) => {
    // Get the image metadata first
    const image = await ctx.db.get(args.id);

    if (!image) {
      throw new ConvexError("Image not found");
    }

    // Delete the file from storage
    await ctx.storage.delete(image.storageId);

    // Delete the database record
    await ctx.db.delete(args.id);

    return { success: true, deletedId: args.id };
  },
});

// Mutation for attaching timeframe to a image
export const updateImage = mutation({
  args: {
    id: v.id("tradingview_images"),
    snapshotId: v.id("snapshots"),
    timeframe: v.string(),
  },
  handler: async (ctx, { id, ...args }) => {
    return await ctx.db.patch(id, args);
  },
});
