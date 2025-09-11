import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new trade setup
export const createTradeSetup = mutation({
  args: {
    title: v.string(),
    asset: v.string(),
    direction: v.union(v.literal("long"), v.literal("short")),
    status: v.union(
      v.literal("idea"),
      v.literal("watching"),
      v.literal("executed"),
      v.literal("closed"),
      v.literal("reviewed")
    ),
    riskReward: v.optional(v.string()),
    timeframes: v.array(v.string()),
    tags: v.optional(v.any()), // Strategy form data as JSON
    imageId: v.optional(v.id("tradingview_images")), // Link to the image that triggered this trade setup
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create the trade setup
    const tradeSetupId = await ctx.db.insert("trade_setups", {
      title: args.title,
      asset: args.asset,
      direction: args.direction,
      status: args.status,
      riskReward: args.riskReward,
      timeframes: args.timeframes,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    });

    // If an image was provided, link it to this trade setup
    if (args.imageId) {
      await ctx.db.patch(args.imageId, {
        tradeSetupId,
        onboarding_complete: true,
      });
    }

    return tradeSetupId;
  },
});

// Update an existing trade setup
export const updateTradeSetup = mutation({
  args: {
    id: v.id("trade_setups"),
    title: v.optional(v.string()),
    direction: v.optional(v.union(v.literal("long"), v.literal("short"))),
    status: v.optional(
      v.union(
        v.literal("idea"),
        v.literal("watching"),
        v.literal("executed"),
        v.literal("closed"),
        v.literal("reviewed")
      )
    ),
    riskReward: v.optional(v.string()),
    timeframes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Get a single trade setup by ID
export const getTradeSetup = query({
  args: { id: v.id("trade_setups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get all trade setups with optional filtering
export const getTradeSetups = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("idea"),
        v.literal("watching"),
        v.literal("executed"),
        v.literal("closed"),
        v.literal("reviewed")
      )
    ),
    asset: v.optional(v.string()),
    direction: v.optional(v.union(v.literal("long"), v.literal("short"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("trade_setups")
      .withIndex("by_created_at")
      .order("desc");

    // Apply filters
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    if (args.asset) {
      query = query.filter((q) => q.eq(q.field("asset"), args.asset));
    }
    if (args.direction) {
      query = query.filter((q) => q.eq(q.field("direction"), args.direction));
    }

    // Collect all results first, then apply limit if needed
    const results = await query.collect();

    // Apply limit if specified
    if (args.limit) {
      return results.slice(0, args.limit);
    }

    return results;
  },
});

// Get all images associated with a trade setup
export const getTradeSetupImages = query({
  args: { tradeSetupId: v.id("trade_setups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tradingview_images")
      .withIndex("by_trade_setup", (q) =>
        q.eq("tradeSetupId", args.tradeSetupId)
      )
      .collect();
  },
});

// Link an additional image to an existing trade setup
export const linkImageToTradeSetup = mutation({
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
});

// Delete a trade setup (and unlink associated images)
export const deleteTradeSetup = mutation({
  args: { id: v.id("trade_setups") },
  handler: async (ctx, args) => {
    // First, unlink all associated images
    const images = await ctx.db
      .query("tradingview_images")
      .withIndex("by_trade_setup", (q) => q.eq("tradeSetupId", args.id))
      .collect();

    for (const image of images) {
      await ctx.db.patch(image._id, {
        tradeSetupId: undefined,
        onboarding_complete: false,
      });
    }

    // Then delete the trade setup
    await ctx.db.delete(args.id);

    return args.id;
  },
});
