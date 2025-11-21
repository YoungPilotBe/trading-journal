import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/**
 * Hook to fetch actual R-Multiple evolution chart data for a trade setup
 * Calculates R-Multiple using each snapshot's TPSL entries and entry price
 *
 * @param tradeSetupId - The ID of the trade setup to get evolution data for
 * @param enabled - Whether the query should be enabled. Set to false to prevent fetching.
 */
export const useActualRMultipleEvolution = (
  tradeSetupId: Id<"trade_setups"> | null,
  enabled = true
) => {
  const queryResult = useQuery({
    ...convexQuery(
      api.charts.queries.getActualRMultipleEvolutionChart,
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

