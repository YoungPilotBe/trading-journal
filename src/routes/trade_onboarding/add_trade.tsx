import AddTradeForm from "@/components/form/forms/add_trade_form";
import { preloadAddTradeFormData } from "@/lib/preloadRoutes";
import { createFileRoute } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { z } from "zod";

const searchSchema = z.object({
  tradeSetupId: z.optional(
    z.custom<Id<"trade_setups">>((val) => typeof val === "string")
  ),
  snapshotId: z.optional(
    z.custom<Id<"snapshots">>((val) => typeof val === "string")
  ),
  imageId: z.custom<Id<"tradingview_images">>((val) => typeof val === "string"),
  image: z.optional(z.enum(["preview"])),
  attach: z.optional(z.boolean()),
  onboarding: z.optional(z.boolean()),
});

export const Route = createFileRoute("/trade_onboarding/add_trade")({
  component: RouteComponent,
  validateSearch: searchSchema,
  // Use pendingComponent to show loading state while data loads
  pendingComponent: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-muted-foreground font-mono text-sm">Loading...</div>
    </div>
  ),
  loaderDeps: ({ search: { snapshotId, imageId } }) => ({
    imageId,
    snapshotId,
  }),
  loader: async ({
    deps: { imageId, snapshotId },
    context: { queryClient },
  }) => {
    await preloadAddTradeFormData(queryClient, imageId, snapshotId);
    return { imageId, snapshotId };
  },
});

function RouteComponent() {
  const { snapshotId, imageId, attach } = Route.useSearch();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Right-side form panel - opposite to the centered AnimatedImageLayout */}
      <div className="absolute left-[60%] right-[10%] top-[20%] bottom-[40%] h-auto max-h-[70vh] max-w-[30vw] pointer-events-auto">
        <AddTradeForm
          snapshotId={snapshotId as Id<"snapshots">}
          imageId={imageId}
          attach={attach}
          disabledFields={
            attach
              ? [
                  "title",
                  "asset",
                  "creationTime",
                  "direction",
                  "timeframe",
                  "timeframes",
                ]
              : undefined
          }
        />
      </div>
    </div>
  );
}
