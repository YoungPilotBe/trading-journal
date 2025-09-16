import { v } from "convex/values";
import { query } from "../_generated/server";
import { sortOrder } from "../constants/unions";

// Get a trade template by ID
export const getTemplate = query({
  args: { id: v.optional(v.id("trade_templates")) },
  handler: async (ctx, args) => {
    if (!args.id) return;
    return await ctx.db.get(args.id);
  },
});

// Get all trade templates
export const getTemplates = query({
  args: {
    sortOrder,
  },
  handler: async (ctx, { sortOrder = "desc" }) => {
    return await ctx.db
      .query("trade_templates")
      .order(sortOrder === "desc" ? "desc" : "asc")
      .collect();
  },
});
