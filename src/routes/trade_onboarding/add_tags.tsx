import { Button } from "@/components/ui/button";
import { useUpdateSnapshot } from "@/hooks/snapshots/use-update-snapshot";
import { EffectsProvider } from "@/rjsf/EffectsContext";
import { Tree } from "@/tree/tree";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Doc, Id } from "convex/_generated/dataModel";
import { useState } from "react";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";

interface TreeState {
  expandedKeys: Set<string>;
  selectedNodes: Set<string>;
  tags: Record<string, unknown>;
}

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

  // Create tree state from snapshot data
  const createTreeStateFromSnapshot = (
    snapshot: Doc<"snapshots"> | null
  ): TreeState | undefined => {
    if (snapshot?.tags_config) {
      // Restore complete tree state from saved config
      return {
        expandedKeys: new Set<string>(
          snapshot.tags_config.expandedKeys || ["strategy"]
        ),
        selectedNodes: new Set<string>(
          snapshot.tags_config.selectedNodes || []
        ),
        tags: snapshot.tags || {},
      };
    } else if (snapshot?.tags) {
      // Legacy: for backwards compatibility, just use the tags with default expanded state
      return {
        expandedKeys: new Set<string>(["strategy"]),
        selectedNodes: new Set<string>(),
        tags: snapshot.tags,
      };
    }

    // Default empty state
    return undefined;
  };

  const [treeState, setTreeState] = useState(() =>
    createTreeStateFromSnapshot(snapshot)
  );

  const handleTreeStateChange = (newState: TreeState) => {
    setTreeState(newState);
  };

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
    }); // Temporary cast until types are regenerated

    navigate({ to: "/dashboard" });
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
              initialTreeState={treeState}
              onTreeStateChange={handleTreeStateChange}
            />
          </EffectsProvider>
        </div>

        <Button
          className="absolute bottom-0 right-0 translate-x-full duration-500 ease-out font-mono tracking-wide leading-3"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Proceed"}
        </Button>
      </div>
    </div>
  );
}
