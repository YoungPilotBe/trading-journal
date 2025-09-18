import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAnalyticsConfig, SimilarityWeights } from "../config/analytics";
import {
  calculateTradeSetupSimilarity,
  extractTagsByStatus,
  fetchAllTradeSetupsWithSnapshots,
  fetchTradeSetupWithSnapshots,
  SimilarityScore,
} from "./internal";

/**
 * Find similar trade setups based on tags per status, templates, and assets
 */
export const findSimilarTrades = query({
  args: {
    tradeSetupId: v.id("trade_setups"),
    limit: v.optional(v.number()),
    minSimilarityScore: v.optional(v.number()),
    customWeights: v.optional(
      v.object({
        tagsPerStatus: v.number(),
        template: v.number(),
        asset: v.number(),
      })
    ),
  },
  handler: async (
    ctx,
    args
  ): Promise<
    (SimilarityScore & {
      asset: string;
      direction: "long" | "short";
      title: string;
      riskReward?: string;
    })[]
  > => {
    const config = getAnalyticsConfig();
    const {
      tradeSetupId,
      limit = config.defaultLimit,
      minSimilarityScore = config.defaultMinSimilarityScore,
      customWeights,
    } = args;

    try {
      // Fetch the target trade setup with its snapshots
      const targetTradeSetup = await fetchTradeSetupWithSnapshots(
        ctx.db,
        tradeSetupId
      );

      if (!targetTradeSetup) {
        throw new Error("Trade setup not found");
      }

      // Fetch all other trade setups with their snapshots
      const allTradeSetups = await fetchAllTradeSetupsWithSnapshots(
        ctx.db,
        tradeSetupId
      );

      // Calculate similarities with basic trade setup info
      const similarities: (SimilarityScore & {
        asset: string;
        direction: "long" | "short";
        title: string;
        riskReward?: string;
      })[] = [];

      for (const otherTradeSetup of allTradeSetups) {
        const similarity = calculateTradeSetupSimilarity(
          targetTradeSetup,
          otherTradeSetup,
          customWeights as SimilarityWeights | undefined
        );

        // Only include results above the minimum similarity threshold
        if (similarity.similarityScore >= minSimilarityScore) {
          similarities.push({
            ...similarity,
            asset: otherTradeSetup.asset,
            direction: otherTradeSetup.direction,
            title: otherTradeSetup.title,
            riskReward: otherTradeSetup.riskReward,
          });
        }
      }

      // Sort by similarity score (descending) and limit results
      return similarities
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
    } catch (error) {
      console.error("Error finding similar trades:", error);
      throw error;
    }
  },
});

/**
 * Get detailed analysis of a specific trade setup's tags by status
 */
export const getTradeSetupAnalysis = query({
  args: {
    tradeSetupId: v.id("trade_setups"),
  },
  handler: async (ctx, args) => {
    const tradeSetupWithSnapshots = await fetchTradeSetupWithSnapshots(
      ctx.db,
      args.tradeSetupId
    );

    if (!tradeSetupWithSnapshots) {
      throw new Error("Trade setup not found");
    }

    // Extract and analyze the trade setup data
    const tagsByStatus = extractTagsByStatus(tradeSetupWithSnapshots.snapshots);

    return {
      tradeSetup: {
        id: tradeSetupWithSnapshots._id,
        title: tradeSetupWithSnapshots.title,
        asset: tradeSetupWithSnapshots.asset,
        direction: tradeSetupWithSnapshots.direction,
        template: tradeSetupWithSnapshots.trade_template,
      },
      tagsByStatus,
      snapshotCount: tradeSetupWithSnapshots.snapshots.length,
      statusProgression: tradeSetupWithSnapshots.snapshots.map((s) => ({
        status: s.status,
        createdAt: s.createdAt,
        tagCount: s.tags ? Object.keys(s.tags).length : 0,
      })),
    };
  },
});

/**
 * Get analytics overview of all trade setups
 */
export const getAnalyticsOverview = query({
  args: {},
  handler: async (ctx) => {
    const allTradeSetups = await ctx.db.query("trade_setups").collect();
    const allSnapshots = await ctx.db.query("snapshots").collect();

    // Note: snapshotsByTradeSetup could be used for future analytics features

    // Calculate basic statistics
    const totalTradeSetups = allTradeSetups.length;
    const totalSnapshots = allSnapshots.length;
    const avgSnapshotsPerTrade =
      totalTradeSetups > 0 ? totalSnapshots / totalTradeSetups : 0;

    // Asset distribution
    const assetDistribution = allTradeSetups.reduce(
      (acc, trade) => {
        acc[trade.asset] = (acc[trade.asset] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Direction distribution
    const directionDistribution = allTradeSetups.reduce(
      (acc, trade) => {
        acc[trade.direction] = (acc[trade.direction] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Status distribution
    const statusDistribution = allSnapshots.reduce(
      (acc, snapshot) => {
        acc[snapshot.status] = (acc[snapshot.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      overview: {
        totalTradeSetups,
        totalSnapshots,
        avgSnapshotsPerTrade: Math.round(avgSnapshotsPerTrade * 100) / 100,
      },
      distributions: {
        assets: assetDistribution,
        directions: directionDistribution,
        statuses: statusDistribution,
      },
    };
  },
});

/**
 * Get a snapshot with a specific status for a trade setup
 * Falls back to the most recent snapshot if no matching status found
 */
export const getSnapshotByStatus = query({
  args: {
    tradeSetupId: v.id("trade_setups"),
    status: v.string(),
  },
  handler: async (ctx, { tradeSetupId, status }) => {
    // Get all snapshots for this trade setup
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup", (q) => q.eq("tradeSetupId", tradeSetupId))
      .order("desc") // Most recent first
      .collect();

    // First, try to find a snapshot with the exact status
    const matchingSnapshot = snapshots.find(
      (snapshot) => snapshot.status === status
    );

    if (matchingSnapshot) {
      return matchingSnapshot;
    }

    // If no exact match, return the most recent snapshot
    return snapshots[0] || null;
  },
});
