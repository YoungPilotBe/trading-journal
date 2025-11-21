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

// TP/SL Entries by Snapshot Query Options
export const tpslEntriesBySnapshotQueryOptions = (
  snapshotId: Id<"snapshots">
) =>
  queryOptions({
    ...convexQuery(api.tpsl.queries.getTpslEntriesBySnapshot, { snapshotId }),
  });

// TP/SL Entries by Trade Setup Query Options
export const tpslEntriesByTradeSetupQueryOptions = (
  tradeSetupId: Id<"trade_setups">
) =>
  queryOptions({
    ...convexQuery(api.tpsl.queries.getTpslEntriesByTradeSetup, {
      tradeSetupId,
    }),
  });

// Preloader function for the add trade form
export const preloadAddTradeFormData = async (
  queryClient: QueryClient,
  imageId: Id<"tradingview_images">
) => {
  // Preload image and smart title
  const [imageData, smartTitle] = await Promise.all([
    queryClient.ensureQueryData(imageQueryOptions(imageId)),
    queryClient.ensureQueryData(smartTitleQueryOptions()),
  ]);

  // Preload
  return {
    imageData,
    smartTitle,
  };
};

// Template R-Multiple Chart Query Options
export const templateRMultipleChartQueryOptions = (
  filterType: "all" | "closed" = "all"
) =>
  queryOptions({
    ...convexQuery(api.charts.queries.getTemplateRMultipleChart, {
      filterType,
    }),
  });

// Preloader function for the attach trade form
export const preloadAttachTradeFormData = async (
  queryClient: QueryClient,
  imageId: Id<"tradingview_images">,
  tradeSetupId: Id<"trade_setups">,
  snapshotId?: Id<"snapshots">
) => {
  // Preload image
  const imageData = await queryClient.ensureQueryData(
    imageQueryOptions(imageId)
  );

  // Preload trade setup by ID
  const existingTradeSetup = await queryClient.ensureQueryData(
    tradeSetupQueryOptions(tradeSetupId)
  );

  // Preload snapshot if provided
  let existingSnapshot = undefined;
  if (snapshotId) {
    existingSnapshot = await queryClient.ensureQueryData(
      snapshotQueryOptions(snapshotId)
    );
  }

  // Preload previous statuses and TP/SL entries by trade setup
  const [previousStatuses, tpslEntries] = await Promise.all([
    queryClient.ensureQueryData(previousStatusesQueryOptions(tradeSetupId)),
    queryClient.ensureQueryData(
      tpslEntriesByTradeSetupQueryOptions(tradeSetupId)
    ),
  ]);

  return {
    imageData,
    existingTradeSetup,
    existingSnapshot,
    previousStatuses: previousStatuses || [],
    tpslEntries: tpslEntries || [],
  };
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

  // Preload both filter types for template chart
  promises.push(
    queryClient.ensureQueryData(templateRMultipleChartQueryOptions("all"))
  );
  promises.push(
    queryClient.ensureQueryData(templateRMultipleChartQueryOptions("closed"))
  );

  await Promise.all(promises);
};
