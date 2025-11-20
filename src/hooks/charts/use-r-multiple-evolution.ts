import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/**
 * Hook to fetch R-Multiple evolution chart data for a trade setup
 *
 * @param tradeSetupId - The ID of the trade setup to get evolution data for
 * @param enabled - Whether the query should be enabled. Set to false to prevent fetching.
 */
export const useRMultipleEvolution = (
  tradeSetupId: Id<"trade_setups"> | null,
  enabled = true
) => {
  const queryResult = useQuery({
    ...convexQuery(
      api.charts.queries.getRMultipleEvolutionChart,
      tradeSetupId ? { tradeSetupId } : ({ tradeSetupId: "" as Id<"trade_setups"> })
    ),
    enabled: enabled && tradeSetupId !== null,
  });

  return {
    data: queryResult.data?.data ?? null,
    chartConfig: queryResult.data?.chartConfig ?? null,
    chartColors: queryResult.data?.chartColors ?? null,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
  };
};

