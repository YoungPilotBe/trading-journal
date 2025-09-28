import { v } from "convex/values";
import { internalMutation, mutation } from "../_generated/server";

// Seed the database with base titles
export const seedBaseTitles = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if we already have base titles
    const existingTitles = await ctx.db.query("base_titles").collect();

    if (existingTitles.length > 0) {
      return {
        message: "Base titles already exist",
        count: existingTitles.length,
      };
    }

    const baseTitles = [
      "Phoenix",
      "Wither",
      "Storm",
      "Viper",
      "Shadow",
      "Thunder",
      "Blaze",
      "Frost",
      "Titan",
      "Raven",
      "Crimson",
      "Ember",
      "Mystic",
      "Vortex",
      "Nexus",
      "Apex",
      "Zenith",
      "Quantum",
      "Cipher",
      "Prism",
    ];

    const now = Date.now();
    const insertedTitles = [];

    for (const title of baseTitles) {
      const titleId = await ctx.db.insert("base_titles", {
        title,
        createdAt: now,
      });
      insertedTitles.push({ id: titleId, title });
    }

    return {
      message: "Base titles seeded successfully",
      count: insertedTitles.length,
      titles: insertedTitles,
    };
  },
});

// Add a new base title
export const addBaseTitle = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, { title }) => {
    // Check if title already exists
    const existing = await ctx.db
      .query("base_titles")
      .withIndex("by_title", (q) => q.eq("title", title))
      .first();

    if (existing) {
      throw new Error(`Base title "${title}" already exists`);
    }

    const titleId = await ctx.db.insert("base_titles", {
      title,
      createdAt: Date.now(),
    });

    return { id: titleId, title };
  },
});

// Remove a base title
export const removeBaseTitle = mutation({
  args: {
    id: v.id("base_titles"),
  },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return { message: "Base title removed successfully" };
  },
});
