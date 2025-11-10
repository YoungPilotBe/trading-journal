import UpdateTradeForm from "@/components/form/forms/update-trade-form";
import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { useGetTradeSetup } from "@/hooks/trade-setup/use-get-trade-setup";
import { preloadSetupRouteData } from "@/lib/preloadRoutes";
import { createFileRoute } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { z } from "zod";

const searchSchema = z.object({
  tradeSetupId: z.custom<Id<"trade_setups">>((val) => typeof val === "string"),
  snapshotId: z.custom<Id<"snapshots">>((val) => typeof val === "string"),
  imageId: z.custom<Id<"tradingview_images">>((val) => typeof val === "string"),
  image: z.optional(z.enum(["preview"])),
  onboarding: z.optional(z.boolean()),
});

export const Route = createFileRoute("/trade_onboarding/update_trade")({
  component: RouteComponent,
  validateSearch: searchSchema,
  // Use pendingComponent to show loading state while data loads
  pendingComponent: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-muted-foreground font-mono text-sm">Loading...</div>
    </div>
  ),
  loaderDeps: ({ search: { snapshotId, tradeSetupId } }) => ({
    tradeSetupId,
    snapshotId,
  }),
  loader: async ({
    deps: { tradeSetupId, snapshotId },
    context: { queryClient },
  }) => {
    await preloadSetupRouteData(queryClient, tradeSetupId, snapshotId);
    return { tradeSetupId, snapshotId };
  },
});

function RouteComponent() {
  const { snapshotId, imageId, tradeSetupId } = Route.useSearch();

  const { data: tradeSetup } = useGetTradeSetup({
    id: tradeSetupId as Id<"trade_setups">,
  });

  const { data: snapshot } = useGetSnapshot({
    id: snapshotId as Id<"snapshots">,
  });

  if (!tradeSetup || !snapshot) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-muted-foreground font-mono text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Right-side form panel - opposite to the centered AnimatedImageLayout */}
      <div className="absolute left-[60%] right-[10%] top-[20%] bottom-[40%] h-auto max-h-[70vh] max-w-[30vw] pointer-events-auto">
        <UpdateTradeForm
          tradeSetup={tradeSetup}
          snapshot={snapshot}
          imageId={imageId}
        />
      </div>
    </div>
  );
}

