import { Button } from "@/components/ui/button";
import { Timeframe } from "@/config/timeframe-order";
import { useUpdateSnapshot } from "@/hooks/snapshots/use-update-snapshot";
import { TreeProvider, useTreeState } from "@/tree/TreeContext";
import { generateStrategy } from "@/tree/strategies";
import { Tree } from "@/tree/tree";
import { createTreeStateFromSnapshot } from "@/tree/tree.utils";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";

const searchSchema = z.object({
  tradeSetupId: z.string(),
  imageId: z.string(),
  snapshotId: z.string(),
  attach: z.optional(z.boolean()),
  viewOnly: z.optional(z.boolean()),
  onboarding: z.optional(z.boolean()),
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
    const [tradeSetup, snapshot, previousSnapshot] = await Promise.all([
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
      queryClient.ensureQueryData(
        convexQuery(api.snaphot.queries.getPreviousSnapshot, {
          id: snapshotId as Id<"snapshots">,
        })
      ),
    ]);

    return {
      tradeSetup,
      snapshot,
      previousSnapshot,
    };
  },
});

// Component that uses tree state from context
function TreeContent({ viewOnly }: { viewOnly: boolean }) {
  const { snapshotId } = Route.useSearch();
  const navigate = useNavigate();
  const { mutateAsync: updateSnapshot, isPending } = useUpdateSnapshot();
  const treeState = useTreeState();

  // Save both tags and complete tree state configuration
  const handleSubmit = async () => {
    await updateSnapshot({
      snapshotId: snapshotId as Id<"snapshots">,
      tags: treeState?.tags || {},
      tags_config: treeState
        ? {
            expandedKeys: Array.from(treeState.expandedKeys),
            selectedNodes: Array.from(treeState.selectedNodes),
          }
        : undefined,
    });

    navigate({ to: "/dashboard" });
  };

  return (
    <>
      <Tree viewOnly={viewOnly} className="overflow-y-auto flex-1" />
      {!viewOnly && (
        <Button
          className="absolute bottom-0 right-0 translate-x-full duration-500 ease-out font-mono tracking-wide leading-3"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Update"}
        </Button>
      )}
    </>
  );
}

function RouteComponent() {
  const { viewOnly = false } = Route.useSearch();
  const { tradeSetup, snapshot, previousSnapshot } = Route.useLoaderData();
  if (!snapshot || !tradeSetup) return;
  // Create initial tree state from snapshot data
  const initialTreeState = createTreeStateFromSnapshot(
    snapshot,
    previousSnapshot
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Right-side form panel - similar to add_trade layout */}
      <div className="absolute right-[60%] left-[10%] top-[20%] bottom-[20%] h-auto max-h-[70vh] max-w-[25vw] min-w-[700px] pointer-events-auto ">
        <div className="flex flex-col items-start space-y-2 mt-2 h-full">
          <span className="text-white font-light font-mono">Tags</span>
          <TreeProvider
            tradeSetup={tradeSetup}
            selectedTags={initialTreeState.selectedNodes}
            initialTreeState={initialTreeState}
            strategy={generateStrategy(
              snapshot!.status,
              (tradeSetup?.timeframes || []) as Timeframe[]
            )}
          >
            <TreeContent viewOnly={viewOnly} />
          </TreeProvider>
        </div>
      </div>
    </div>
  );
}
