import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { getAnalyticsConfig, SimilarityWeights } from "../../config/analytics";

export const useFindSimilarTrades = (
  args: FunctionArgs<typeof api.analytics.queries.findSimilarTrades>
) => {
  return useQuery(convexQuery(api.analytics.queries.findSimilarTrades, args));
};

export const useFindSimilarTradesWithOptions = (
  tradeSetupId: Id<"trade_setups">,
  options: {
    limit?: number;
    minSimilarityScore?: number;
    customWeights?: SimilarityWeights;
    filterBySnapshotStatus?: string;
    enabled?: boolean;
  } = {}
) => {
  const config = getAnalyticsConfig();
  const {
    limit = config.defaultLimit,
    minSimilarityScore = config.defaultMinSimilarityScore,
    customWeights,
    filterBySnapshotStatus,
    enabled = true,
  } = options;

  return useQuery({
    ...convexQuery(api.analytics.queries.findSimilarTrades, {
      tradeSetupId,
      limit,
      minSimilarityScore,
      customWeights,
      filterBySnapshotStatus,
    }),
    enabled: enabled && !!tradeSetupId,
  });
};
