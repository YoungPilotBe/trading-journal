import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";

export const createTemplate = mutation({
  args: {
    document: v.any(),
    drawingId: v.optional(v.id("drawings")),
    imageIds: v.optional(v.array(v.id("tradingview_images"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const title = args.document?.[0]?.content?.[0]?.text ?? "Untitled";

    return await ctx.db.insert("trade_templates", {
      document: args.document,
      title,
      drawingId: args.drawingId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateTemplate = mutation({
  args: {
    id: v.id("trade_templates"),
    document: v.any(),
    drawingId: v.optional(v.id("drawings")),
    imageIds: v.optional(v.array(v.id("tradingview_images"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const title = args.document?.[0]?.content?.[0]?.text ?? "Untitled";

    // Get the existing template to preserve fields not being updated
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Template not found");
    }

    return await ctx.db.patch(id, {
      ...updates,
      title,
      updatedAt: Date.now(),
    });
  },
});

// Delete a trade template
export const deleteTemplate = mutation({
  args: { id: v.id("trade_templates") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new Error("Template not found");
    }

    // Remove template reference from all associated trade setups
    if (existing.tradeSetupIds && existing.tradeSetupIds.length > 0) {
      for (const tradeSetupId of existing.tradeSetupIds) {
        await ctx.runMutation(
          internal.trade_setup.internal.removeTradeTemplate,
          {
            id: tradeSetupId,
          }
        );
      }
    }

    // Delete associated drawing if it exists
    if (existing.drawingId) {
      await ctx.db.delete(existing.drawingId);
    }

    // Delete the template
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
