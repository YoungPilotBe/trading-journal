import { preloadAllProgressionCharts } from "@/lib/preloadRoutes";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Id } from "convex/_generated/dataModel";

/**
 * Hook to preload all progression charts for all snapshotIds of a trade setup
 * This will prefetch all progression charts so they're ready when the user navigates
 *
 * @param tradeSetupId - The ID of the trade setup to preload charts for
 * @param enabled - Whether the preloading should be enabled. Defaults to true.
 */
export const usePreloadProgressionCharts = (
  tradeSetupId: Id<"trade_setups"> | null,
  enabled = true
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !tradeSetupId) {
      return;
    }

    // Preload all progression charts in the background
    preloadAllProgressionCharts(queryClient, tradeSetupId).catch((error) => {
      // Silently handle errors - preloading failures shouldn't break the app
      console.warn("Failed to preload progression charts:", error);
    });
  }, [queryClient, tradeSetupId, enabled]);
};

