import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const removeTradeTemplate = internalMutation({
  args: {
    id: v.id("trade_setups"),
  },
  handler: async (ctx, args) => {
    const tradeSetup = await ctx.db.get(args.id);
    if (!tradeSetup) {
      throw new Error("Trade setup not found");
    }

    await ctx.db.patch(args.id, {
      trade_template: undefined,
    });
  },
});
