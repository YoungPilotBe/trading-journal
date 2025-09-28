import { v } from "convex/values";
import { query } from "../_generated/server";
import {
  SimilarityWeights,
  SNAPSHOT_SIMILARITY_CONFIG,
  TRADE_SETUP_SIMILARITY_CONFIG,
} from "../config/analytics";
import {
  calculateTradeSetupSimilarity,
  extractTagsByStatus,
  fetchAllTradeSetupsWithSnapshots,
  fetchTradeSetupWithSnapshots,
  SimilarityScore,
} from "./internal";

/**
 * Find similar trade setups based primarily on strategy and asset similarity
 * This focuses on high-level trade setup characteristics rather than execution details
 */
export const findSimilarTradeSetups = query({
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
      riskReward: number | null;
    })[]
  > => {
    const config = TRADE_SETUP_SIMILARITY_CONFIG;
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
        riskReward: number | null;
      })[] = [];

      for (const otherTradeSetup of allTradeSetups) {
        // Use the standard trade setup similarity calculation (no snapshot filtering)
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
      console.error("Error finding similar trade setups:", error);
      throw error;
    }
  },
});

/**
 * Find similar snapshots based primarily on tag similarity
 * This focuses on execution patterns and trading decisions rather than high-level strategy
 */
export const findSimilarSnapshots = query({
  args: {
    snapshotId: v.id("snapshots"),
    limit: v.optional(v.number()),
    minSimilarityScore: v.optional(v.number()),
    customWeights: v.optional(
      v.object({
        tagsPerStatus: v.number(),
        template: v.number(),
        asset: v.number(),
      })
    ),
    filterByStatus: v.optional(v.string()), // Filter snapshots by status
    filterByAsset: v.optional(v.string()), // Filter snapshots by asset
  },
  handler: async (
    ctx,
    args
  ): Promise<
    (SimilarityScore & {
      asset: string;
      direction: "long" | "short";
      title: string;
      riskReward: number | null;
      snapshotStatus: string;
      snapshotCreatedAt: number;
    })[]
  > => {
    const config = SNAPSHOT_SIMILARITY_CONFIG;
    const {
      snapshotId,
      limit = config.defaultLimit,
      minSimilarityScore = config.defaultMinSimilarityScore,
      customWeights,
      filterByStatus,
      filterByAsset,
    } = args;

    try {
      // First, get the target snapshot and its trade setup
      const targetSnapshot = await ctx.db.get(snapshotId);
      if (!targetSnapshot) {
        throw new Error("Target snapshot not found");
      }

      const targetTradeSetup = await ctx.db.get(targetSnapshot.tradeSetupId);
      if (!targetTradeSetup) {
        throw new Error("Target trade setup not found");
      }

      // Fetch all snapshots from the database (excluding the target)
      let allSnapshots = await ctx.db
        .query("snapshots")
        .filter((q) => q.neq(q.field("_id"), snapshotId))
        .collect();

      // Apply filters
      if (filterByStatus) {
        allSnapshots = allSnapshots.filter(
          (snapshot) => snapshot.status === filterByStatus
        );
      }

      if (filterByAsset) {
        // Filter by trade setup asset
        const tradeSetupsByAsset = await ctx.db
          .query("trade_setups")
          .filter((q) => q.eq(q.field("asset"), filterByAsset))
          .collect();

        const tradeSetupIds = new Set(tradeSetupsByAsset.map((ts) => ts._id));
        allSnapshots = allSnapshots.filter((snapshot) =>
          tradeSetupIds.has(snapshot.tradeSetupId)
        );
      }

      // Calculate similarities
      const similarities: (SimilarityScore & {
        asset: string;
        direction: "long" | "short";
        title: string;
        riskReward: number | null;
        snapshotStatus: string;
        snapshotCreatedAt: number;
      })[] = [];

      for (const otherSnapshot of allSnapshots) {
        // Get the trade setup for this snapshot
        const otherTradeSetup = await ctx.db.get(otherSnapshot.tradeSetupId);
        if (!otherTradeSetup) continue;

        // Create mock trade setups with single snapshots for similarity calculation
        const targetTradeSetupWithSnapshot = {
          ...targetTradeSetup,
          snapshots: [targetSnapshot],
        };

        const otherTradeSetupWithSnapshot = {
          ...otherTradeSetup,
          snapshots: [otherSnapshot],
        };

        // Calculate similarity using the snapshot-focused config
        const similarity = calculateTradeSetupSimilarity(
          targetTradeSetupWithSnapshot,
          otherTradeSetupWithSnapshot,
          customWeights as SimilarityWeights | undefined
        );

        // Only include results above the minimum similarity threshold
        if (similarity.similarityScore >= minSimilarityScore) {
          similarities.push({
            ...similarity,
            snapshotId: otherSnapshot._id,
            asset: otherTradeSetup.asset,
            direction: otherTradeSetup.direction,
            title: otherTradeSetup.title,
            riskReward: otherTradeSetup.riskReward,
            snapshotStatus: otherSnapshot.status,
            snapshotCreatedAt: otherSnapshot._creationTime,
          });
        }
      }

      // Sort by similarity score (descending) and limit results
      return similarities
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);
    } catch (error) {
      console.error("Error finding similar snapshots:", error);
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
