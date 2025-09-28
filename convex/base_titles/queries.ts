import { internalQuery, query } from "../_generated/server";

// Get all base titles
export const getAllBaseTitles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("base_titles")
      .withIndex("by_created_at")
      .order("asc")
      .collect();
  },
});

// Get the least used base title with advanced logic
export const getLeastUsedBaseTitle = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get all base titles
    const baseTitles = await ctx.db.query("base_titles").collect();

    if (baseTitles.length === 0) {
      throw new Error("No base titles found. Please seed the database first.");
    }

    // Count usage for each base title
    const titleUsageCounts = await Promise.all(
      baseTitles.map(async (baseTitle) => {
        // Count how many trade setups use this base title
        // We'll check if the trade setup title starts with the base title
        const tradeSetups = await ctx.db.query("trade_setups").collect();

        const usageCount = tradeSetups.filter((setup) =>
          setup.title.toLowerCase().startsWith(baseTitle.title.toLowerCase())
        ).length;

        return {
          ...baseTitle,
          usageCount,
        };
      })
    );

    // Sort by usage count (ascending) to get least used first
    titleUsageCounts.sort((a, b) => a.usageCount - b.usageCount);

    // Get all titles with the minimum usage count (in case of ties)
    const minUsageCount = titleUsageCounts[0].usageCount;
    const leastUsedTitles = titleUsageCounts.filter(
      (title) => title.usageCount === minUsageCount
    );

    // Return a random title from the least used ones
    const randomIndex = Math.floor(Math.random() * leastUsedTitles.length);
    return leastUsedTitles[randomIndex];
  },
});

// Get usage statistics for all base titles
export const getBaseTitleUsageStats = query({
  args: {},
  handler: async (ctx) => {
    const baseTitles = await ctx.db.query("base_titles").collect();
    const tradeSetups = await ctx.db.query("trade_setups").collect();

    const stats = baseTitles.map((baseTitle) => {
      const usageCount = tradeSetups.filter((setup) =>
        setup.title.toLowerCase().startsWith(baseTitle.title.toLowerCase())
      ).length;

      return {
        id: baseTitle._id,
        title: baseTitle.title,
        usageCount,
        createdAt: baseTitle.createdAt,
      };
    });

    // Sort by usage count (ascending)
    stats.sort((a, b) => a.usageCount - b.usageCount);

    return {
      stats,
      totalBaseTitles: baseTitles.length,
      totalTradeSetups: tradeSetups.length,
      mostUsed: stats[stats.length - 1],
      leastUsed: stats[0],
    };
  },
});
