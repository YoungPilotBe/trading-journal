import { convexQuery } from "@convex-dev/react-query";
import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Id } from "convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

// Trade Setup Query Options
export const tradeSetupQueryOptions = (id: Id<"trade_setups">) =>
  queryOptions({
    ...convexQuery(api.trade_setup.queries.getTradeSetup, { id }),
  });

// Snapshot Query Options
export const snapshotQueryOptions = (id: Id<"snapshots">) =>
  queryOptions({
    ...convexQuery(api.snaphot.queries.getSnapshot, { id }),
  });

// Snapshots by Trade Setup Query Options
export const snapshotsByTradeSetupQueryOptions = (
  tradeSetupId: Id<"trade_setups">,
  sortBy: "createdAt" = "createdAt",
  sortOrder: "asc" | "desc" = "asc"
) =>
  queryOptions({
    ...convexQuery(api.snaphot.queries.getSnapshotByTradeSetup, {
      tradeSetupId,
      sortBy,
      sortOrder,
    }),
  });

// Image by Snapshot Query Options
export const imageBySnapshotQueryOptions = (snapshotId: Id<"snapshots">) =>
  queryOptions({
    ...convexQuery(api.tradingview_images.queries.getImageBySnapshot, {
      snapshotId,
    }),
  });

// Templates Query Options
export const templatesQueryOptions = (sortOrder: "asc" | "desc" = "desc") =>
  queryOptions({
    ...convexQuery(api.template.queries.getTemplates, { sortOrder }),
  });

// Preloader function for the setup route
export const preloadSetupRouteData = async (
  queryClient: QueryClient,
  tradeSetupId?: string,
  snapshotId?: string
) => {
  const promises = [];

  if (tradeSetupId) {
    promises.push(
      queryClient.ensureQueryData(
        tradeSetupQueryOptions(tradeSetupId as Id<"trade_setups">)
      )
    );
  }

  if (snapshotId && tradeSetupId) {
    promises.push(
      queryClient.ensureQueryData(
        snapshotsByTradeSetupQueryOptions(
          tradeSetupId as Id<"trade_setups">,
          "createdAt",
          "asc"
        )
      )
    );
    promises.push(
      queryClient.ensureQueryData(
        imageBySnapshotQueryOptions(snapshotId as Id<"snapshots">)
      )
    );
  }

  if (snapshotId) {
    promises.push(
      queryClient.ensureQueryData(
        snapshotQueryOptions(snapshotId as Id<"snapshots">)
      )
    );
  }

  // Always preload templates
  promises.push(queryClient.ensureQueryData(templatesQueryOptions("desc")));

  await Promise.all(promises);
};
