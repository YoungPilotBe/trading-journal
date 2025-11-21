import AttachTradeForm from "@/components/form/forms/attach-trade-form";
import { preloadAttachTradeFormData } from "@/lib/preloadRoutes";
import { createFileRoute } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { z } from "zod";

const searchSchema = z.object({
  snapshotId: z.optional(
    z.custom<Id<"snapshots">>((val) => typeof val === "string")
  ),
  tradeSetupId: z.custom<Id<"trade_setups">>((val) => typeof val === "string"),
  imageId: z.custom<Id<"tradingview_images">>((val) => typeof val === "string"),
  image: z.optional(z.enum(["preview"])),
  onboarding: z.optional(z.boolean()),
});

export const Route = createFileRoute("/trade_onboarding/attach_trade")({
  component: RouteComponent,
  validateSearch: searchSchema,
  // Use pendingComponent to show loading state while data loads
  pendingComponent: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-muted-foreground font-mono text-sm">Loading...</div>
    </div>
  ),
  loaderDeps: ({ search: { snapshotId, imageId, tradeSetupId } }) => ({
    imageId,
    snapshotId,
    tradeSetupId,
  }),
  loader: async ({
    deps: { imageId, snapshotId, tradeSetupId },
    context: { queryClient },
  }) => {
    const preloadedData = await preloadAttachTradeFormData(
      queryClient,
      imageId,
      tradeSetupId,
      snapshotId
    );
    return { imageId, snapshotId, tradeSetupId, ...preloadedData };
  },
});

function RouteComponent() {
  const { snapshotId, imageId, tradeSetupId } = Route.useSearch();
  const {
    existingTradeSetup,
    existingSnapshot,
    imageData,
    previousStatuses,
    tpslEntries,
  } = Route.useLoaderData();

  console.log({ tpslEntries });

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Right-side form panel - opposite to the centered AnimatedImageLayout */}
      <div className="absolute left-[60%] right-[10%] top-[20%] bottom-[40%] h-auto max-h-[70vh] max-w-[30vw] pointer-events-auto">
        <AttachTradeForm
          tradeSetupId={tradeSetupId}
          snapshotId={snapshotId as Id<"snapshots">}
          imageId={imageId}
          existingTradeSetup={existingTradeSetup}
          existingSnapshot={existingSnapshot}
          imageData={imageData}
          previousStatuses={previousStatuses}
          tpslEntries={tpslEntries}
        />
      </div>
    </div>
  );
}
