import { v } from "convex/values";
import { query } from "../_generated/server";

export const getImage = query({
  args: {
    id: v.id("tradingview_images"),
  },
  handler: async (ctx, args) => {
    const image_metadata = await ctx.db.get(args.id);

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

export const getImageBySnapshot = query({
  args: {
    snapshotId: v.id("snapshots"),
  },
  handler: async (ctx, args) => {
    // Get the image metadata
    const image_metadata = await ctx.db
      .query("tradingview_images")
      .filter((q) => q.eq(q.field("snapshotId"), args.snapshotId))
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
