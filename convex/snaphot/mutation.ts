import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { statusUnion } from "../constants/unions";

export const updateSnapshot = mutation({
  args: {
    snapshotId: v.id("snapshots"),
    status: v.optional(statusUnion),
    tags: v.optional(v.any()),
  },
  handler: async (ctx, { snapshotId, ...updates }) => {
    return await ctx.db.patch(snapshotId, { ...updates });
  },
});

export const createSnapshot = mutation({
  args: {
    tradeSetupId: v.id("trade_setups"),
    status: statusUnion,
    imageId: v.id("tradingview_images"),
  },
  handler: async (ctx, { imageId, tradeSetupId, status }) => {
    const now = Date.now();

    const snapshotId = await ctx.db.insert("snapshots", {
      tradeSetupId,
      status: status,
      imageId: imageId,
      createdAt: now,
    });

    await ctx.db.patch(imageId, {
      snapshotId,
      onboarding_complete: true,
    });

    return { tradeSetupId, snapshotId };
  },
});
