import { internal } from "../_generated/api";
import { query } from "../_generated/server";

export const generateSmartTitle = query({
  args: {},
  handler: async (
    ctx
  ): Promise<{
    title: string;
    usageCount: number;
  }> => {
    const leastUsedTitle = await ctx.runQuery(
      internal.base_titles.queries.getLeastUsedBaseTitle
    );

    if (!leastUsedTitle) {
      throw new Error("No base titles available");
    }

    return {
      title: leastUsedTitle.title,
      usageCount: leastUsedTitle.usageCount,
    };
  },
});
