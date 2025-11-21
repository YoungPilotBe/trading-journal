import AddTradeForm from "@/components/form/forms/add_trade_form";
import { preloadAddTradeFormData } from "@/lib/preloadRoutes";
import { createFileRoute } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { z } from "zod";

const searchSchema = z.object({
  snapshotId: z.optional(
    z.custom<Id<"snapshots">>((val) => typeof val === "string")
  ),
  imageId: z.custom<Id<"tradingview_images">>((val) => typeof val === "string"),
  image: z.optional(z.enum(["preview"])),
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
  loaderDeps: ({ search: { imageId } }) => ({
    imageId,
  }),
  loader: async ({ deps: { imageId }, context: { queryClient } }) => {
    const preloadedData = await preloadAddTradeFormData(queryClient, imageId);
    return { imageId, ...preloadedData };
  },
});

function RouteComponent() {
  const { imageId } = Route.useSearch();
  const { imageData, smartTitle } = Route.useLoaderData();

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Right-side form panel - opposite to the centered AnimatedImageLayout */}
      <div className="absolute left-[60%] right-[10%] top-[20%] bottom-[40%] h-auto max-h-[70vh] max-w-[30vw] pointer-events-auto">
        <AddTradeForm
          imageId={imageId}
          imageData={imageData}
          smartTitle={smartTitle}
        />
      </div>
    </div>
  );
}
