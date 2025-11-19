import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

/**
 * Hook to fetch template risk-reward chart data, config, and colors
 *
 * @param enabled - Whether the query should be enabled. Set to false to prevent fetching.
 * @param filterType - Filter type: "all" for all trades (except canceled) or "closed" for closed/reviewed trades only
 */
export const useRiskRewardChart = (
  enabled = true,
  filterType: "all" | "closed" = "all"
) => {
  const queryResult = useQuery({
    ...convexQuery(api.charts.queries.getTemplateRiskRewardChart, {
      filterType,
    }),
    enabled,
  });

  return {
    data: queryResult.data?.data ?? null,
    chartConfig: queryResult.data?.chartConfig ?? null,
    chartColors: queryResult.data?.chartColors ?? null,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
  };
};
