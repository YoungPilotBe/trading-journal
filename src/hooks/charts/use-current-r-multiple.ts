import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/**
 * Hook to fetch the current R-multiple value for a trade setup
 *
 * @param tradeSetupId - The ID of the trade setup to get current R-multiple for
 * @param currentSnapshotId - Optional snapshot ID to calculate up to (defaults to latest)
 * @param enabled - Whether the query should be enabled. Set to false to prevent fetching.
 */
export const useCurrentRMultiple = (
  tradeSetupId: Id<"trade_setups"> | null,
  currentSnapshotId: Id<"snapshots"> | null | undefined,
  enabled = true
) => {
  const queryResult = useQuery({
    ...convexQuery(api.charts.progression.queries.getCurrentRMultipleQuery, {
      tradeSetupId: tradeSetupId ?? ("" as Id<"trade_setups">),
      currentSnapshotId: currentSnapshotId ?? undefined,
    }),
    enabled: enabled && tradeSetupId !== null,
  });

  return {
    currentRMultiple: queryResult.data?.currentRMultiple ?? null,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
  };
};


