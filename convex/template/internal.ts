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
