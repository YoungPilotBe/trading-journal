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
    imageId: v.id("tradingview_images"), // Link to the image that triggered this trade setup
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
      imageId: args.imageId,
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
    trade_template: v.optional(v.id("trade_templates")),
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

// Get trade setup by image ID
export const getTradeSetupByImageId = query({
  args: { imageId: v.id("tradingview_images") },
  handler: async (ctx, args) => {
    const query = await ctx.db
      .query("trade_setups")
      .withIndex("by_image_id", (q) => q.eq("imageId", args.imageId))
      .first();

    return query;
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
    if (args.status)
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    if (args.asset)
      query = query.filter((q) => q.eq(q.field("asset"), args.asset));
    if (args.direction)
      query = query.filter((q) => q.eq(q.field("direction"), args.direction));

    const results = await query.collect();
    const limitedResults = args.limit ? results.slice(0, args.limit) : results;

    // Enrich with trade template data
    return await Promise.all(
      limitedResults.map(async (setup) => ({
        ...setup,
        tradeTemplateData: setup.trade_template
          ? await ctx.db.get(setup.trade_template)
          : null,
      }))
    );
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

// Add tags to an existing trade setup
export const addTags = mutation({
  args: {
    id: v.id("trade_setups"),
    tags: v.any(), // Strategy form data as JSON
  },
  handler: async (ctx, args) => {
    // Get the current trade setup to access existing timeframe couples
    const currentTradeSetup = await ctx.db.get(args.id);

    // Clean up timeframe couples for removed tags
    let updatedTimeframeCouples = currentTradeSetup?.timeframeTagCouples || {};

    if (
      typeof updatedTimeframeCouples === "object" &&
      updatedTimeframeCouples !== null
    ) {
      // Get the list of active tags (tags that are truthy)
      const activeTags = Object.entries(args.tags || {})
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key);

      // Remove timeframe couples for tags that are no longer active
      const cleanedTimeframeCouples: Record<string, string> = {};
      for (const [tagKey, timeframe] of Object.entries(
        updatedTimeframeCouples
      )) {
        if (activeTags.includes(tagKey) && typeof timeframe === "string") {
          cleanedTimeframeCouples[tagKey] = timeframe;
        }
      }

      updatedTimeframeCouples = cleanedTimeframeCouples;
    }

    await ctx.db.patch(args.id, {
      tags: args.tags,
      timeframeTagCouples: updatedTimeframeCouples,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const addTimeframeCouples = mutation({
  args: {
    id: v.id("trade_setups"),
    timeframeTagCouples: v.any(), // Strategy form data as JSON
  },
  handler: async (ctx, args) => {
    // Get the current trade setup to access existing tags
    const currentTradeSetup = await ctx.db.get(args.id);

    // Only keep timeframe couples for tags that are currently active
    let validatedTimeframeCouples = args.timeframeTagCouples || {};

    if (
      currentTradeSetup?.tags &&
      typeof validatedTimeframeCouples === "object" &&
      validatedTimeframeCouples !== null
    ) {
      // Get the list of active tags (tags that are truthy)
      const activeTags = Object.entries(currentTradeSetup.tags || {})
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key);

      // Only keep timeframe couples for active tags
      const cleanedTimeframeCouples: Record<string, string> = {};
      for (const [tagKey, timeframe] of Object.entries(
        validatedTimeframeCouples
      )) {
        if (
          activeTags.includes(tagKey) &&
          timeframe &&
          typeof timeframe === "string"
        ) {
          // Only keep non-empty timeframes
          cleanedTimeframeCouples[tagKey] = timeframe;
        }
      }

      validatedTimeframeCouples = cleanedTimeframeCouples;
    }

    await ctx.db.patch(args.id, {
      timeframeTagCouples: validatedTimeframeCouples,
      updatedAt: Date.now(),
    });

    return args.id;
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
