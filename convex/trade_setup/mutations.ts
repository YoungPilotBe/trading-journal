import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";
import { resultUnion, statusUnion } from "../constants/unions";

// Update an existing trade setup
export const updateTradeSetup = mutation({
  args: {
    id: v.id("trade_setups"),
    snapshotId: v.id("snapshots"),
    imageId: v.optional(v.id("tradingview_images")),
    title: v.optional(v.union(v.string(), v.null())),
    direction: v.optional(v.union(v.literal("long"), v.literal("short"))),
    status: v.optional(statusUnion),
    trade_template: v.optional(v.id("trade_templates")),
    riskReward: v.optional(v.union(v.number(), v.null())),
    result: v.optional(resultUnion),
    timeframes: v.optional(v.array(v.string())),
    timeframe: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, snapshotId, title, timeframe, imageId, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    if (title) {
      await ctx.db.patch(id, {
        title,
      });
    }

    if (args.trade_template) {
      await ctx.runMutation(
        internal.template.internal.addTradeSetupToTemplate,
        { tradeSetupId: id, templateId: args.trade_template }
      );
    }

    const imgId =
      imageId ??
      (
        await ctx.db
          .query("tradingview_images")
          .withIndex("by_snapshot", (q) => q.eq("snapshotId", snapshotId))
          .first()
      )?._id;

    if (!imgId) throw new ConvexError("No associated image to snapshot found");

    await ctx.db.patch(imgId, { timeframe });

    return { snapshotId, tradeSetupId: id };
  },
});

export const deleteTradeSetup = mutation({
  args: {
    tradeSetupId: v.id("trade_setups"),
  },
  handler: async (ctx, { tradeSetupId }) => {
    // Delete all the snapshots
    await ctx.runMutation(
      internal.orchestration.mutations.deleteSnapshotsByTradeSetupId,
      { tradeSetupId }
    );

    await ctx.runMutation(
      internal.template.internal.removeTradeSetupFromAllTemplates,
      { tradeSetupId }
    );

    await ctx.db.delete(tradeSetupId);

    return tradeSetupId;
  },
});
