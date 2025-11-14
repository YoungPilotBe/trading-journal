import { buttonVariants } from "@/components/ui/button";
import { Timeframe } from "@/config/timeframe-order";
import { useUpdateSnapshot } from "@/hooks/snapshots/use-update-snapshot";
import { createIdeaStrategyTree } from "@/tree/strategies/idea.constants.new";
import Tree from "@/tree/tree.new";
import {
  createTreeStateFromSnapshot,
  type ITreeState,
} from "@/tree/tree.utils.new";
import { TreeProvider } from "@/tree/TreeContext.new";
import { convexQuery } from "@convex-dev/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import clsx from "clsx";
import { Id } from "convex/_generated/dataModel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback } from "react";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";

const searchSchema = z.object({
  tradeSetupId: z.custom<Id<"trade_setups">>((val) => typeof val === "string"),
  imageId: z.custom<Id<"tradingview_images">>((val) => typeof val === "string"),
  snapshotId: z.string(),
  attach: z.optional(z.boolean()),
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
    const [tradeSetup, snapshot, previousSnapshot, timeframes] =
      await Promise.all([
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
        queryClient.ensureQueryData(
          convexQuery(api.trade_setup.queries.getTradeSetupTimeframes, {
            tradeSetupId: tradeSetupId as Id<"trade_setups">,
          })
        ),
      ]);

    return {
      tradeSetup,
      snapshot,
      previousSnapshot,
      timeframes,
    };
  },
});

function RouteComponent() {
  const { tradeSetup, snapshot, previousSnapshot, timeframes } =
    Route.useLoaderData();
  // Mutation to save tree state (must be before conditional return)

  const { mutateAsync: updateSnapshot, isPending } = useUpdateSnapshot();

  // Handle tree state changes - save to database (must be before conditional return)
  const handleStateChange = useCallback(
    (newState: ITreeState) => {
      if (!snapshot) return;

      updateSnapshot({
        snapshotId: snapshot._id,
        tags: newState.tags,
        tags_config: {
          expandedKeys: Array.from(newState.expandedPaths),
          selectedNodes: Array.from(newState.selectedPaths),
        },
      });
    },
    [snapshot, updateSnapshot]
  );

  // Conditional returns must come after all hooks
  if (!snapshot || !tradeSetup || !timeframes) return null;

  // Initialize tree state from snapshot data
  const initialTreeState = createTreeStateFromSnapshot(
    snapshot,
    previousSnapshot
  );

  // Create strategy trees with available timeframes
  // Dynamic instances will be automatically hydrated by TreeProvider
  const trees = createIdeaStrategyTree({
    availableTimeframes: timeframes as Timeframe[],
  });

  return (
    <div className="absolute inset-0">
      {/* Right-side form panel - similar to add_trade layout */}
      <div className="absolute right-[60%] left-[10%] top-[20%] bottom-[20%] h-auto max-h-[70vh] max-w-[25vw] min-w-[700px] pointer-events-auto">
        <div className="flex w-full flex-col items-start space-y-2 mt-2 h-full  ">
          <div className="w-full flex flex-row justify-between items-center  overflow-hidden">
            <span className="text-white font-light font-mono">Tags</span>
          </div>
          <TreeProvider
            tradeSetup={tradeSetup}
            trees={trees}
            initialTreeState={initialTreeState}
            onTreeStateChange={handleStateChange}
          >
            <Tree className="overflow-y-auto h-full" />
          </TreeProvider>
        </div>
      </div>
      <Link
        className={buttonVariants({
          variant: "default",
          className: clsx(
            `absolute bottom-36 left-1/2 -translate-x-1/2 duration-500 ease-out font-mono tracking-wide leading-3 rounded-none hover:gap-0.5 transition w-40`,
            isPending && "opacity-50 pointer-events-none"
          ),
        })}
        to="/dashboard/setup"
        search={{
          snapshotId: snapshot._id,
          tradeSetupId: tradeSetup._id,
        }}
      >
        <ChevronLeft />
        Complete
        <ChevronRight />
      </Link>
    </div>
  );
}
