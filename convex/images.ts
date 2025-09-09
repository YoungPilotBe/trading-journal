import { query } from "./_generated/server";

export const getLatestImage = query({
  handler: async (ctx) => {
    return await ctx.db.query("files").order("desc").collect();
  },
});
