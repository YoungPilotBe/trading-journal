import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";

export const createTemplate = mutation({
  args: {
    document: v.any(),
    drawingId: v.optional(v.id("drawings")),
    drawingUrl: v.optional(v.string()),
    imageIds: v.optional(v.array(v.id("tradingview_images"))),
    zoomMode: v.optional(v.union(v.literal("cover"), v.literal("contain"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const title = args.document?.[0]?.content?.[0]?.text ?? "Untitled";

    return await ctx.db.insert("trade_templates", {
      document: args.document,
      title,
      drawingId: args.drawingId,
      drawingUrl: args.drawingUrl,
      zoomMode: args.zoomMode ?? "cover", // Default to "cover" mode
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
    drawingUrl: v.optional(v.string()),
    imageIds: v.optional(v.array(v.id("tradingview_images"))),
    zoomMode: v.optional(v.union(v.literal("cover"), v.literal("contain"))),
  },
  handler: async (ctx, args) => {
    const { id, document, drawingId, drawingUrl, imageIds, zoomMode } = args;
    const title = args.document?.[0]?.content?.[0]?.text ?? "Untitled";

    // Get the existing template to preserve fields not being updated
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Template not found");
    }

    // Build update object
    // Only include fields that are explicitly provided in args
    // This allows us to clear fields (by passing undefined) or preserve them (by not passing them)
    const updateData: {
      document: string;
      title: string;
      updatedAt: number;
      drawingId?: Id<"drawings"> | undefined;
      drawingUrl?: string | undefined;
      imageIds?: Id<"tradingview_images">[];
      zoomMode?: "cover" | "contain";
    } = {
      document,
      title,
      updatedAt: Date.now(),
    };

    // Only update drawingId if it was explicitly provided in the args
    // This allows us to clear it (by passing undefined) or set it (by passing a value)
    // If not provided, the field won't be included and existing value will be preserved
    if ("drawingId" in args) {
      updateData.drawingId = drawingId;
    }
    // Only update drawingUrl if it was explicitly provided in the args
    // This allows us to clear it (by passing undefined) or set it (by passing a value)
    // If not provided, the field won't be included and existing value will be preserved
    if ("drawingUrl" in args) {
      updateData.drawingUrl = drawingUrl;
    }
    // Handle imageIds: if provided, update it
    if (imageIds !== undefined) {
      updateData.imageIds = imageIds;
    }
    // Handle zoomMode: if provided, update it
    if (zoomMode !== undefined) {
      updateData.zoomMode = zoomMode;
    }

    return await ctx.db.patch(id, updateData);
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
