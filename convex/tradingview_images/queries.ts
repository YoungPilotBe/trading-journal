import { v } from "convex/values";
import { query } from "../_generated/server";

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
