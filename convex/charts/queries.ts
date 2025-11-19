import { v } from "convex/values";
import { query } from "../_generated/server";
import {
  EMOTION_CHART_COLORS,
  EVOLUTION_CHART_COLORS,
  TEMPLATE_CHART_COLORS,
} from "./constants";

/**
 * Get emotion risk-reward chart data
 * Analyzes which emotions correlate with higher risk-reward ratios
 */
export const getEmotionRiskRewardChart = query({
  args: {},
  handler: async (ctx) => {
    // Fetch all snapshots that have both emotion and riskReward values
    const allSnapshots = await ctx.db.query("snapshots").collect();

    // Filter snapshots with both emotion and riskReward
    const validSnapshots = allSnapshots.filter(
      (snapshot) =>
        snapshot.emotion &&
        snapshot.riskReward !== undefined &&
        snapshot.riskReward !== null
    );

    if (validSnapshots.length === 0) {
      return {
        data: [],
        chartConfig: {},
        chartColors: {},
      };
    }

    // Group snapshots by emotion and calculate statistics
    const emotionStats = new Map<
      string,
      { totalRiskReward: number; count: number }
    >();

    for (const snapshot of validSnapshots) {
      const emotion = snapshot.emotion!;
      const riskReward = snapshot.riskReward!;

      const existing = emotionStats.get(emotion);
      if (existing) {
        existing.totalRiskReward += riskReward;
        existing.count += 1;
      } else {
        emotionStats.set(emotion, {
          totalRiskReward: riskReward,
          count: 1,
        });
      }
    }

    // Calculate average riskReward for each emotion
    const data = Array.from(emotionStats.entries())
      .map(([emotion, stats]) => ({
        emotion,
        avgRiskReward: stats.totalRiskReward / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avgRiskReward - a.avgRiskReward); // Sort descending by avgRiskReward

    return {
      data,
      chartConfig: {
        type: "bar",
        xAxis: "emotion",
        yAxis: "avgRiskReward",
      },
      chartColors: EMOTION_CHART_COLORS,
    };
  },
});

/**
 * Get template risk-reward chart data
 * Analyzes which trade templates perform best based on risk-reward
 */
export const getTemplateRiskRewardChart = query({
  args: {
    filterType: v.optional(v.union(v.literal("all"), v.literal("closed"))),
  },
  handler: async (ctx, { filterType = "all" }) => {
    // Fetch all trade setups that have a trade_template
    const allTradeSetups = await ctx.db.query("trade_setups").collect();
    const tradeSetupsWithTemplates = allTradeSetups.filter(
      (setup) => setup.trade_template !== undefined
    );

    if (tradeSetupsWithTemplates.length === 0) {
      return {
        data: [],
        chartConfig: {},
        chartColors: {},
      };
    }

    // Define status filters based on filterType
    const allowedStatuses =
      filterType === "closed"
        ? ["closed", "reviewed"] // Only closed and reviewed for final risk/reward
        : ["idea", "watching", "executed", "closed", "reviewed"]; // All except canceled

    // Group snapshots by template
    const templateStats = new Map<
      string,
      { totalRiskReward: number; count: number; templateTitle: string }
    >();

    for (const tradeSetup of tradeSetupsWithTemplates) {
      const templateId = tradeSetup.trade_template!;

      // Fetch template to get title (handle case where template might be deleted)
      const template = await ctx.db.get(templateId);
      if (!template) {
        continue; // Skip deleted templates
      }

      // Get all snapshots for this trade setup
      const snapshots = await ctx.db
        .query("snapshots")
        .withIndex("by_trade_setup", (q) =>
          q.eq("tradeSetupId", tradeSetup._id)
        )
        .collect();

      // Filter snapshots based on status and riskReward values
      const validSnapshots = snapshots.filter(
        (snapshot) =>
          allowedStatuses.includes(snapshot.status) &&
          snapshot.riskReward !== undefined &&
          snapshot.riskReward !== null
      );

      // Aggregate riskReward for this template
      const existing = templateStats.get(templateId);
      if (existing) {
        for (const snapshot of validSnapshots) {
          existing.totalRiskReward += snapshot.riskReward!;
          existing.count += 1;
        }
      } else {
        let totalRiskReward = 0;
        for (const snapshot of validSnapshots) {
          totalRiskReward += snapshot.riskReward!;
        }
        templateStats.set(templateId, {
          totalRiskReward,
          count: validSnapshots.length,
          templateTitle: template.title,
        });
      }
    }

    // Calculate average riskReward for each template
    const data = Array.from(templateStats.entries())
      .map(([templateId, stats]) => ({
        templateId,
        templateTitle: stats.templateTitle,
        avgRiskReward:
          stats.count > 0 ? stats.totalRiskReward / stats.count : 0,
        count: stats.count,
      }))
      .filter((item) => item.count > 0) // Only include templates with data
      .sort((a, b) => b.avgRiskReward - a.avgRiskReward); // Sort descending by avgRiskReward

    // Calculate total count for usage percentage
    const totalCount = data.reduce((sum, item) => sum + item.count, 0);

    // Add usage percentage to each item
    const dataWithUsage = data.map((item) => ({
      ...item,
      usagePercentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0,
    }));

    return {
      data: dataWithUsage,
      chartConfig: {
        type: "pie",
        xAxis: "templateTitle",
        yAxis: "avgRiskReward",
      },
      chartColors: TEMPLATE_CHART_COLORS,
    };
  },
});

/**
 * Get risk-reward evolution chart data for a specific trade setup
 * Returns snapshots ordered by creation time with their risk-reward values
 */
export const getRiskRewardEvolutionChart = query({
  args: {
    tradeSetupId: v.id("trade_setups"),
  },
  handler: async (ctx, { tradeSetupId }) => {
    // Fetch all snapshots for this trade setup, ordered by creation time
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", tradeSetupId)
      )
      .order("asc") // Oldest first to show evolution over time
      .collect();

    // Map snapshots to chart data format
    // Include all snapshots, even if riskReward is undefined (will show as null/0)
    const data = snapshots.map((snapshot, index) => ({
      snapshotId: snapshot._id,
      index: index, // Use index for positioning
      riskReward: snapshot.riskReward ?? null,
      status: snapshot.status,
      createdAt: snapshot.createdAt,
    }));

    return {
      data,
      chartConfig: {
        type: "line",
        xAxis: "index",
        yAxis: "riskReward",
      },
      chartColors: EVOLUTION_CHART_COLORS,
    };
  },
});
