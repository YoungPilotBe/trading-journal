import { v } from "convex/values";
import { query } from "./_generated/server";

// Get image URL by storageId
export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});

// Get multiple image URLs by storageIds
export const getImageUrls = query({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, args) => {
    const urls = await Promise.all(
      args.storageIds.map(async (storageId) => ({
        storageId,
        url: await ctx.storage.getUrl(storageId),
      }))
    );
    return urls;
  },
});

// Get recent files with their image URLs (combines file metadata with URLs)
export const getRecentImagesWithUrls = query({
  args: {
    limit: v.optional(v.number()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("files").order("desc");

    if (args.source) {
      query = query.filter((q) => q.eq(q.field("source"), args.source));
    }

    const files = await query.take(args.limit || 10);

    // Add download URLs to each file
    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        imageUrl: await ctx.storage.getUrl(file.storageId),
      }))
    );

    return filesWithUrls;
  },
});
