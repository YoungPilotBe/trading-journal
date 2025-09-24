import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  SNAPSHOT_SIMILARITY_CONFIG,
  SimilarityWeights,
  TRADE_SETUP_SIMILARITY_CONFIG,
} from "../../../convex/config/analytics";

// Trade Setup Similarity Hooks
export const useFindSimilarTradeSetups = (
  args: FunctionArgs<typeof api.analytics.queries.findSimilarTradeSetups>
) => {
  return useQuery(
    convexQuery(api.analytics.queries.findSimilarTradeSetups, args)
  );
};

export const useFindSimilarTradeSetupsWithOptions = (
  tradeSetupId: Id<"trade_setups">,
  options: {
    limit?: number;
    minSimilarityScore?: number;
    customWeights?: SimilarityWeights;
    enabled?: boolean;
  } = {}
) => {
  const config = TRADE_SETUP_SIMILARITY_CONFIG;
  const {
    limit = config.defaultLimit,
    minSimilarityScore = config.defaultMinSimilarityScore,
    customWeights,
    enabled = true,
  } = options;

  return useQuery({
    ...convexQuery(api.analytics.queries.findSimilarTradeSetups, {
      tradeSetupId,
      limit,
      minSimilarityScore,
      customWeights,
    }),
    enabled: enabled && !!tradeSetupId,
  });
};

// Snapshot Similarity Hooks
export const useFindSimilarSnapshots = (
  args: FunctionArgs<typeof api.analytics.queries.findSimilarSnapshots>
) => {
  return useQuery(
    convexQuery(api.analytics.queries.findSimilarSnapshots, args)
  );
};

export const useFindSimilarSnapshotsWithOptions = (
  snapshotId: Id<"snapshots">,
  options: {
    limit?: number;
    minSimilarityScore?: number;
    customWeights?: SimilarityWeights;
    filterByStatus?: string;
    filterByAsset?: string;
    enabled?: boolean;
  } = {}
) => {
  const config = SNAPSHOT_SIMILARITY_CONFIG;
  const {
    limit = config.defaultLimit,
    minSimilarityScore = config.defaultMinSimilarityScore,
    customWeights,
    filterByStatus,
    filterByAsset,
    enabled = true,
  } = options;

  return useQuery({
    ...convexQuery(api.analytics.queries.findSimilarSnapshots, {
      snapshotId,
      limit,
      minSimilarityScore,
      customWeights,
      filterByStatus,
      filterByAsset,
    }),
    enabled: enabled && !!snapshotId,
  });
};

// Legacy hooks for backward compatibility (deprecated)
export const useFindSimilarTrades = useFindSimilarTradeSetups;
export const useFindSimilarTradesWithOptions =
  useFindSimilarTradeSetupsWithOptions;
