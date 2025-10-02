import { convexQuery } from "@convex-dev/react-query";
import { QueryClient, queryOptions } from "@tanstack/react-query";
import { Id } from "convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

// Trade Setup Query Options
export const tradeSetupQueryOptions = (id: Id<"trade_setups">) =>
  queryOptions({
    ...convexQuery(api.trade_setup.queries.getTradeSetup, { id }),
  });

// Trade Setup by Snapshot Query Options
export const tradeSetupBySnapshotQueryOptions = (snapshotId: Id<"snapshots">) =>
  queryOptions({
    ...convexQuery(api.trade_setup.queries.getTradeSetupBySnapshotId, {
      snapshotId,
    }),
  });

// Snapshot Query Options
export const snapshotQueryOptions = (id: Id<"snapshots">) =>
  queryOptions({
    ...convexQuery(api.snaphot.queries.getSnapshot, { id }),
  });

// Previous Statuses Query Options
export const previousStatusesQueryOptions = (
  tradeSetupId?: Id<"trade_setups">
) =>
  queryOptions({
    ...convexQuery(api.snaphot.queries.getPreviousStatuses, {
      tradeSetupId,
    }),
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

// Image Query Options
export const imageQueryOptions = (id: Id<"tradingview_images">) =>
  queryOptions({
    ...convexQuery(api.tradingview_images.queries.getImage, { id }),
  });

// Image by Snapshot Query Options
export const imageBySnapshotQueryOptions = (snapshotId: Id<"snapshots">) =>
  queryOptions({
    ...convexQuery(api.tradingview_images.queries.getImageBySnapshot, {
      snapshotId,
    }),
  });

// Smart Title Query Options
export const smartTitleQueryOptions = () =>
  queryOptions({
    ...convexQuery(api.base_titles.utilities.generateSmartTitle, {}),
  });

// Templates Query Options
export const templatesQueryOptions = (sortOrder: "asc" | "desc" = "desc") =>
  queryOptions({
    ...convexQuery(api.template.queries.getTemplates, { sortOrder }),
  });

// Preloader function for the add trade form
export const preloadAddTradeFormData = async (
  queryClient: QueryClient,
  imageId: Id<"tradingview_images">,
  tradeSetupId?: Id<"trade_setups">,
  snapshotId?: Id<"snapshots">
) => {
  const promises = [];

  // Preload image
  promises.push(queryClient.ensureQueryData(imageQueryOptions(imageId)));
  // Preload smart title
  promises.push(queryClient.ensureQueryData(smartTitleQueryOptions()));

  // Preload trade setup
  if (tradeSetupId) {
    promises.push(
      queryClient.ensureQueryData(tradeSetupQueryOptions(tradeSetupId))
    );
  }

  // Preload snapshot
  if (snapshotId) {
    promises.push(
      queryClient.ensureQueryData(snapshotQueryOptions(snapshotId))
    );
  }

  // Preload previous statuses if trade setup exists
  if (tradeSetupId) {
    promises.push(
      queryClient.ensureQueryData(previousStatusesQueryOptions(tradeSetupId))
    );
  }

  await Promise.all(promises);
};

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
