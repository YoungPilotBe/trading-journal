import { v } from "convex/values";
import { api } from "../_generated/api";
import { query } from "../_generated/server";
import {
  EMOTION_CHART_COLORS,
  EVOLUTION_CHART_COLORS,
  TEMPLATE_CHART_COLORS,
} from "./constants";
import { calculateRMultiple } from "./services/r_multiple";

/**
 * Get emotion R-Multiple chart data
 * Analyzes which emotions correlate with higher R-Multiple ratios
 */
export const getEmotionRMultipleChart = query({
  args: {},
  handler: async (ctx) => {
    // Fetch all snapshots that have both emotion and rMultiple values
    const allSnapshots = await ctx.db.query("snapshots").collect();

    // Filter snapshots with both emotion and rMultiple
    const validSnapshots = allSnapshots.filter(
      (snapshot) =>
        snapshot.emotion &&
        snapshot.rMultiple !== undefined &&
        snapshot.rMultiple !== null
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
      { totalRMultiple: number; count: number }
    >();

    for (const snapshot of validSnapshots) {
      const emotion = snapshot.emotion!;
      const rMultiple = snapshot.rMultiple!;

      const existing = emotionStats.get(emotion);
      if (existing) {
        existing.totalRMultiple += rMultiple;
        existing.count += 1;
      } else {
        emotionStats.set(emotion, {
          totalRMultiple: rMultiple,
          count: 1,
        });
      }
    }

    // Calculate average rMultiple for each emotion
    const data = Array.from(emotionStats.entries())
      .map(([emotion, stats]) => ({
        emotion,
        avgRMultiple: stats.totalRMultiple / stats.count,
        count: stats.count,
      }))
      .sort((a, b) => b.avgRMultiple - a.avgRMultiple); // Sort descending by avgRMultiple

    return {
      data,
      chartConfig: {
        type: "bar",
        xAxis: "emotion",
        yAxis: "avgRMultiple",
      },
      chartColors: EMOTION_CHART_COLORS,
    };
  },
});

/**
 * Get template R-Multiple chart data
 * Analyzes which trade templates perform best based on R-Multiple
 */
export const getTemplateRMultipleChart = query({
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
        ? ["closed", "reviewed"] // Only closed and reviewed for final R-Multiple
        : ["idea", "watching", "executed", "closed", "reviewed"]; // All except canceled

    // Group snapshots by template
    const templateStats = new Map<
      string,
      { totalRMultiple: number; count: number; templateTitle: string }
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

      // Filter snapshots based on status and rMultiple values
      const validSnapshots = snapshots.filter(
        (snapshot) =>
          allowedStatuses.includes(snapshot.status) &&
          snapshot.rMultiple !== undefined &&
          snapshot.rMultiple !== null
      );

      // Aggregate rMultiple for this template
      const existing = templateStats.get(templateId);
      if (existing) {
        for (const snapshot of validSnapshots) {
          existing.totalRMultiple += snapshot.rMultiple!;
          existing.count += 1;
        }
      } else {
        let totalRMultiple = 0;
        for (const snapshot of validSnapshots) {
          totalRMultiple += snapshot.rMultiple!;
        }
        templateStats.set(templateId, {
          totalRMultiple,
          count: validSnapshots.length,
          templateTitle: template.title,
        });
      }
    }

    // Calculate average rMultiple for each template
    const data = Array.from(templateStats.entries())
      .map(([templateId, stats]) => ({
        templateId,
        templateTitle: stats.templateTitle,
        avgRMultiple: stats.count > 0 ? stats.totalRMultiple / stats.count : 0,
        count: stats.count,
      }))
      .filter((item) => item.count > 0) // Only include templates with data
      .sort((a, b) => b.avgRMultiple - a.avgRMultiple); // Sort descending by avgRMultiple

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
        yAxis: "avgRMultiple",
      },
      chartColors: TEMPLATE_CHART_COLORS,
    };
  },
});

/**
 * Get R-Multiple evolution chart data for a specific trade setup
 * Returns snapshots ordered by creation time with their R-Multiple values
 */
export const getRMultipleEvolutionChart = query({
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
    // Include all snapshots, even if rMultiple is undefined (will show as null/0)
    const data = snapshots.map((snapshot, index) => ({
      snapshotId: snapshot._id,
      index: index, // Use index for positioning
      rMultiple: snapshot.rMultiple ?? null,
      status: snapshot.status,
      createdAt: snapshot.createdAt,
    }));

    return {
      data,
      chartConfig: {
        type: "line",
        xAxis: "index",
        yAxis: "rMultiple",
      },
      chartColors: EVOLUTION_CHART_COLORS,
    };
  },
});

/**
 * Get actual R-Multiple evolution chart data for a specific trade setup
 * Calculates R-Multiple for each snapshot using its TPSL entries and entry price
 * Returns snapshots ordered by creation time with calculated R-Multiple values
 */
export const getActualRMultipleEvolutionChart = query({
  args: {
    tradeSetupId: v.id("trade_setups"),
  },
  handler: async (ctx, { tradeSetupId }) => {
    // Fetch the trade setup to get the direction
    const tradeSetup = await ctx.db.get(tradeSetupId);
    if (!tradeSetup || !tradeSetup.direction) {
      return {
        data: [],
        chartConfig: {
          type: "line",
          xAxis: "index",
          yAxis: "rMultiple",
        },
        chartColors: EVOLUTION_CHART_COLORS,
      };
    }

    const direction = tradeSetup.direction;

    // Fetch all snapshots for this trade setup, ordered by creation time
    const snapshots = await ctx.db
      .query("snapshots")
      .withIndex("by_trade_setup_and_created_at", (q) =>
        q.eq("tradeSetupId", tradeSetupId)
      )
      .order("asc") // Oldest first to show evolution over time
      .collect();

    // Calculate R-Multiple for each snapshot
    const data = await Promise.all(
      snapshots.map(async (snapshot, index) => {
        // Fetch TPSL entries for this snapshot
        const tpslEntries = await ctx.runQuery(
          api.tpsl.queries.getTpslEntriesBySnapshot,
          { snapshotId: snapshot._id }
        );

        // Separate entries into take profits and stop losses
        const takeProfits = tpslEntries
          .filter((entry) => entry.type === "take_profit")
          .map((entry) => ({
            price: entry.price,
            margin: entry.margin,
          }));

        const stopLosses = tpslEntries
          .filter((entry) => entry.type === "stop_loss")
          .map((entry) => ({
            price: entry.price,
            margin: entry.margin,
          }));

        // Calculate R-Multiple using the snapshot's entry price and TPSL entries
        const calculatedRMultiple = calculateRMultiple(
          snapshot.entryPrice,
          takeProfits,
          stopLosses,
          direction
        );

        return {
          snapshotId: snapshot._id,
          index: index, // Use index for positioning
          rMultiple: calculatedRMultiple ?? null,
          status: snapshot.status,
          createdAt: snapshot.createdAt,
        };
      })
    );

    return {
      data,
      chartConfig: {
        type: "line",
        xAxis: "index",
        yAxis: "rMultiple",
      },
      chartColors: EVOLUTION_CHART_COLORS,
    };
  },
});
