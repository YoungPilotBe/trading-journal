import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new trade template
export const createTemplate = mutation({
  args: {
    document: v.any(),
    drawingId: v.optional(v.id("drawings")),
    imageIds: v.optional(v.array(v.id("tradingview_images"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("trade_templates", {
      document: args.document,
      drawingId: args.drawingId,
      imageIds: args.imageIds || [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an existing trade template
export const updateTemplate = mutation({
  args: {
    id: v.id("trade_templates"),
    document: v.any(),
    drawingId: v.optional(v.id("drawings")),
    imageIds: v.optional(v.array(v.id("tradingview_images"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Get the existing template to preserve fields not being updated
    const existing = await ctx.db.get(id);
    if (!existing) {
      throw new Error("Template not found");
    }

    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Get a trade template by ID
export const getTemplate = query({
  args: { id: v.optional(v.id("trade_templates")) },
  handler: async (ctx, args) => {
    if (!args.id) return;
    return await ctx.db.get(args.id);
  },
});

// Get all trade templates
export const getAllTemplates = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("trade_templates").collect();
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

    // Delete associated drawing if it exists
    if (existing.drawingId) {
      await ctx.db.delete(existing.drawingId);
    }

    // Delete the template
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
