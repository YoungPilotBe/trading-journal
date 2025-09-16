import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";
import { statusUnion } from "../constants/unions";

// Update an existing trade setup
export const updateTradeSetup = mutation({
  args: {
    id: v.id("trade_setups"),
    snapshotId: v.id("snapshots"),
    title: v.optional(v.string()),
    direction: v.optional(v.union(v.literal("long"), v.literal("short"))),
    status: v.optional(statusUnion),
    trade_template: v.optional(v.id("trade_templates")),
    riskReward: v.optional(v.string()),
    timeframes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, snapshotId, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    if (args.trade_template) {
      await ctx.runMutation(
        internal.template.internal.addTradeSetupToTemplate,
        { tradeSetupId: id, templateId: args.trade_template }
      );
    }

    return { snapshotId, tradeSetupId: id };
  },
});

// Link an additional image to an existing trade setup
/*export const linkImageToTradeSetup = mutation({
  args: {
    imageId: v.id("tradingview_images"),
    tradeSetupId: v.id("trade_setups"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageId, {
      tradeSetupId: args.tradeSetupId,
    });

    return args.imageId;
  },
});*/

// export const addTimeframeCouples = mutation({
//   args: {
//     id: v.id("trade_setups"),
//     timeframeTagCouples: v.any(), // Strategy form data as JSON
//   },
//   handler: async (ctx, args) => {
//     // Get the current trade setup to access existing tags
//     const currentTradeSetup = await ctx.db.get(args.id);

//     // Only keep timeframe couples for tags that are currently active
//     let validatedTimeframeCouples = args.timeframeTagCouples || {};

//     if (
//       currentTradeSetup?.tags &&
//       typeof validatedTimeframeCouples === "object" &&
//       validatedTimeframeCouples !== null
//     ) {
//       // Get the list of active tags (tags that are truthy)
//       const activeTags = Object.entries(currentTradeSetup.tags || {})
//         .filter(([, value]) => Boolean(value))
//         .map(([key]) => key);

//       // Only keep timeframe couples for active tags
//       const cleanedTimeframeCouples: Record<string, string> = {};
//       for (const [tagKey, timeframe] of Object.entries(
//         validatedTimeframeCouples
//       )) {
//         if (
//           activeTags.includes(tagKey) &&
//           timeframe &&
//           typeof timeframe === "string"
//         ) {
//           // Only keep non-empty timeframes
//           cleanedTimeframeCouples[tagKey] = timeframe;
//         }
//       }

//       validatedTimeframeCouples = cleanedTimeframeCouples;
//     }

//     await ctx.db.patch(args.id, {
//       timeframeTagCouples: validatedTimeframeCouples,
//       updatedAt: Date.now(),
//     });

//     return args.id;
//   },
// });

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

    await ctx.db.delete(tradeSetupId);

    return tradeSetupId;
  },
});
