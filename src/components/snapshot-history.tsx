import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetSnapshotByTradeSetupId } from "@/hooks/snapshots/use-get-snapshot-by-trade-setup";
import { useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";

interface Props {
  tradeSetupId: Id<"trade_setups">;
  snapshotId: Id<"snapshots">;
}

const SnapshotHistory = ({ snapshotId, tradeSetupId }: Props) => {
  const navigate = useNavigate();
  const [loadingSnapshotId, setLoadingSnapshotId] =
    useState<Id<"snapshots"> | null>(null);

  const { data: snapshots, isLoading: isLoadingSnapshots } =
    useGetSnapshotByTradeSetupId({
      tradeSetupId: tradeSetupId as Id<"trade_setups">,
      sortBy: "createdAt",
      sortOrder: "asc",
    });

  // Note: Preloading is now handled by the route loader
  // This ensures data is actually preloaded, not just the component
  useEffect(() => {
    if (snapshots && snapshots.length > 0) {
      console.log(`${snapshots.length} snapshots available for navigation`);
    }
  }, [snapshots]);

  const handleSnapshotClick = async (targetSnapshotId: Id<"snapshots">) => {
    if (targetSnapshotId === snapshotId) return; // Don't navigate to current snapshot

    setLoadingSnapshotId(targetSnapshotId);

    try {
      console.log(`Navigating to snapshot ${targetSnapshotId}`);

      // Navigate immediately - the route should already be preloaded
      await navigate({
        to: "/dashboard/setup",
        search: { tradeSetupId, snapshotId: targetSnapshotId },
      });

      console.log(`Successfully navigated to snapshot ${targetSnapshotId}`);
    } catch (error) {
      console.error("Failed to load snapshot:", error);
    } finally {
      setLoadingSnapshotId(null);
    }
  };

  // Calculate positions based on actual creation times (timeline)
  const sortedSnapshots = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];

    // If only one snapshot, center it
    if (snapshots.length === 1) {
      return [{ ...snapshots[0], position: 50 }];
    }

    // Find the earliest and latest creation times
    const earliestTime = Math.min(...snapshots.map((s) => s.createdAt));
    const latestTime = Math.max(...snapshots.map((s) => s.createdAt));
    const timeRange = latestTime - earliestTime;

    // If all snapshots have the same creation time, space them evenly
    if (timeRange === 0) {
      return snapshots.map((snapshot, index) => ({
        ...snapshot,
        position: (index / (snapshots.length - 1)) * 100,
      }));
    }

    // Calculate positions based on actual time differences
    return snapshots.map((snapshot) => {
      const timeFromStart = snapshot.createdAt - earliestTime;
      const position = (timeFromStart / timeRange) * 100;
      return {
        ...snapshot,
        position: Math.max(5, Math.min(95, position)), // Keep dots within 5-95% range
      };
    });
  }, [snapshots]);

  if (isLoadingSnapshots) {
    return (
      <div className="w-full h-12 flex items-center justify-center">
        <div className="text-xs text-muted-foreground font-mono">
          Loading timeline...
        </div>
      </div>
    );
  }

  if (!sortedSnapshots || sortedSnapshots.length === 0) {
    return (
      <div className="w-full h-12 flex items-center justify-center">
        <div className="text-xs text-muted-foreground font-mono">
          No snapshots found
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full h-12 relative px-4">
        {/* Horizontal timeline line */}
        <div className="absolute top-1/2 left-4 right-4 h-px bg-muted transform -translate-y-1/2 mask-x-from-95%" />

        {/* Snapshot dots with tooltips */}
        {sortedSnapshots.map((snapshot) => {
          const isCurrentSnapshot = snapshot._id === snapshotId;
          const isLoading = loadingSnapshotId === snapshot._id;

          return (
            <Tooltip key={snapshot._id}>
              <TooltipTrigger asChild>
                <button
                  className={`absolute top-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:size-4 ${
                    isCurrentSnapshot
                      ? "bg-green-500 border-2 border-green-600"
                      : isLoading
                        ? "bg-blue-400 border-2 border-blue-500 animate-pulse"
                        : "bg-gray-500 border-2 border-gray-600 hover:bg-blue-400 hover:border-blue-500"
                  }`}
                  style={{ left: `${snapshot.position}%` }}
                  onClick={() => handleSnapshotClick(snapshot._id)}
                  disabled={isLoading || isCurrentSnapshot}
                />
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={10}
                className="bg-gradient-to-t from-background to-sidebar text-gray-100 border-muted rounded-none"
              >
                <div className="flex items-center space-x-2 font-mono">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCurrentSnapshot
                        ? "bg-green-400"
                        : isLoading
                          ? "bg-blue-400 animate-pulse"
                          : "bg-gray-400"
                    }`}
                  />
                  <span className="text-[11px] tracking-wide">
                    {format(new Date(snapshot.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center space-x-2 font-mono mt-1">
                  <div className="w-2 h-2" />{" "}
                  {/* Spacer to align with dot above */}
                  <span className="text-[10px] text-gray-400">
                    {format(new Date(snapshot.createdAt), "HH:mm:ss")} •{" "}
                    <span className="capitalize">{snapshot.status}</span>
                  </span>
                </div>
                {(isCurrentSnapshot || isLoading) && (
                  <div className="flex items-center space-x-2 font-mono mt-1">
                    <div className="w-2 h-2" /> {/* Spacer */}
                    <span
                      className={`text-[10px] ${
                        isCurrentSnapshot ? "text-green-400" : "text-blue-400"
                      }`}
                    >
                      {isCurrentSnapshot ? "Current" : "Loading..."}
                    </span>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default SnapshotHistory;
