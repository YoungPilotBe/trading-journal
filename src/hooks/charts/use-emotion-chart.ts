import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

/**
 * Hook to fetch emotion chart data, config, and colors
 *
 * @param enabled - Whether the query should be enabled. Set to false to prevent fetching.
 */
export const useEmotionChart = (enabled = true) => {
  const queryResult = useQuery({
    ...convexQuery(api.charts.queries.getEmotionRiskRewardChart, {}),
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
