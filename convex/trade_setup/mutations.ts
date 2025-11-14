import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";
import { resultUnion, statusUnion } from "../constants/unions";

// Update an existing trade setup
export const updateTradeSetup = mutation({
  args: {
    id: v.id("trade_setups"),
    title: v.optional(v.string()),
    direction: v.optional(v.union(v.literal("long"), v.literal("short"))),
    status: v.optional(statusUnion),
    trade_template: v.optional(v.union(v.id("trade_templates"), v.null())),
    result: v.optional(resultUnion),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
      trade_template: args.trade_template ? args.trade_template : undefined,
    });

    if (args.trade_template) {
      await ctx.runMutation(
        internal.template.internal.addTradeSetupToTemplate,
        { tradeSetupId: id, templateId: args.trade_template }
      );
    } else {
      await ctx.runMutation(
        internal.template.internal.removeTradeSetupFromAllTemplates,
        { tradeSetupId: id }
      );
    }

    return { tradeSetupId: id };
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
