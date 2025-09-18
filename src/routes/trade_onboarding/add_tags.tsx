import { Button } from "@/components/ui/button";
import { useUpdateSnapshot } from "@/hooks/snapshots/use-update-snapshot";
import { EffectsProvider } from "@/rjsf/EffectsContext";
import Tree from "@/tree/tree";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { useState } from "react";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";

const searchSchema = z.object({
  tradeSetupId: z.string(),
  imageId: z.string(),
  snapshotId: z.string(),
  attach: z.optional(z.boolean()),
});

export const Route = createFileRoute("/trade_onboarding/add_tags")({
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search: { tradeSetupId, snapshotId } }) => ({
    tradeSetupId,
    snapshotId,
  }),
  loader: async ({
    context: { queryClient },
    deps: { tradeSetupId, snapshotId },
  }) => {
    // Prefetch both tradeSetup and snapshot data
    const [tradeSetup, snapshot] = await Promise.all([
      queryClient.ensureQueryData(
        convexQuery(api.trade_setup.queries.getTradeSetup, {
          id: tradeSetupId as Id<"trade_setups">,
        })
      ),
      queryClient.ensureQueryData(
        convexQuery(api.snaphot.queries.getSnapshot, {
          id: snapshotId as Id<"snapshots">,
        })
      ),
    ]);

    return {
      tradeSetup,
      snapshot,
    };
  },
});

function RouteComponent() {
  const { snapshotId } = Route.useSearch();
  const { tradeSetup, snapshot } = Route.useLoaderData();
  const navigate = useNavigate();
  const { mutateAsync: updateSnapshot, isPending } = useUpdateSnapshot();

  // Store current tree selection
  const [currentTreeSelection, setCurrentTreeSelection] = useState<
    Record<string, unknown>
  >(snapshot?.tags || {});

  console.log("Current tree data:", JSON.stringify(currentTreeSelection));

  const handleTreeChange = (treeSelection: Record<string, unknown>) => {
    console.log("Tree selection changed:", treeSelection);
    setCurrentTreeSelection(treeSelection);
  };

  const onSubmit = async () => {
    // Save the current tree selection as tags
    await updateSnapshot({
      snapshotId: snapshotId as Id<"snapshots">,
      tags: currentTreeSelection,
    });

    // Navigate to a success page or back to the main app
    navigate({
      to: "/dashboard",
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Right-side form panel - similar to add_trade layout */}
      <div className="absolute right-[60%] left-[10%] top-[20%] bottom-[20%] h-auto max-h-[70vh] max-w-[25vw] min-w-[700px] pointer-events-auto ">
        <div className="flex flex-col items-start space-y-2 mt-2">
          <span className="text-white font-light font-mono">Tags</span>
          <EffectsProvider
            tradeSetup={{ ...tradeSetup, ...(snapshot?.tags || {}) }}
          >
            <Tree
              intialTree={snapshot?.tags || {}}
              onTreeChange={handleTreeChange}
            />
          </EffectsProvider>
        </div>

        <Button
          className="absolute bottom-0 right-0 translate-x-full duration-500 ease-out font-mono tracking-wide leading-3"
          onClick={onSubmit}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Proceed"}
        </Button>
      </div>
    </div>
  );
}
