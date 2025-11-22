import type { ProgressionChartData } from "@/charts/chart.types";
import { calculateProgressionPaths } from "@/charts/progression-calculator";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/**
 * Hook to fetch progression chart data for a trade setup
 *
 * @param tradeSetupId - The ID of the trade setup to get progression data for
 * @param currentSnapshotId - The ID of the current snapshot (from search params) - determines which TP/SL entries are possibilities
 * @param enabled - Whether the query should be enabled. Set to false to prevent fetching.
 */
export const useProgressionChart = (
  tradeSetupId: Id<"trade_setups"> | null,
  currentSnapshotId: Id<"snapshots"> | null | undefined,
  enabled = true
) => {
  const queryResult = useQuery({
    ...convexQuery(api.charts.progression.queries.getProgressionChart, {
      tradeSetupId: tradeSetupId ?? ("" as Id<"trade_setups">),
      currentSnapshotId: currentSnapshotId ?? undefined,
    }),
    enabled: enabled && tradeSetupId !== null,
  });

  // Calculate progression paths on the client side
  const calculatedData: ProgressionChartData[] | null =
    queryResult.data && queryResult.data.direction
      ? calculateProgressionPaths(
          queryResult.data.data,
          queryResult.data.direction,
          queryResult.data.currentSnapshotId
        )
      : null;

  return {
    data: calculatedData,
    chartConfig: queryResult.data?.chartConfig ?? null,
    chartColors: queryResult.data?.chartColors ?? null,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    rawData: queryResult.data?.data ?? null,
    direction: queryResult.data?.direction ?? null,
    currentSnapshotId: queryResult.data?.currentSnapshotId ?? null,
  };
};
