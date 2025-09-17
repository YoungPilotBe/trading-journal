import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const addTradeSetupToTemplate = internalMutation({
  args: {
    templateId: v.id("trade_templates"),
    tradeSetupId: v.id("trade_setups"),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    const currentIds = template.tradeSetupIds || [];

    // Only add if not already present
    if (!currentIds.includes(args.tradeSetupId)) {
      await ctx.db.patch(args.templateId, {
        tradeSetupIds: [...currentIds, args.tradeSetupId],
      });
    }
  },
});

export const removeTradeSetupFromAllTemplates = internalMutation({
  args: {
    tradeSetupId: v.id("trade_setups"),
  },
  handler: async (ctx, args) => {
    // Find all templates that contain this tradeSetupId
    const templates = await ctx.db.query("trade_templates").collect();

    for (const template of templates) {
      const currentIds = template.tradeSetupIds || [];

      // Only update if the tradeSetupId is present in this template
      if (currentIds.includes(args.tradeSetupId)) {
        await ctx.db.patch(template._id, {
          tradeSetupIds: currentIds.filter((id) => id !== args.tradeSetupId),
        });
      }
    }
  },
});
