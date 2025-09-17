import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGetSnapshotByTradeSetupId } from "@/hooks/snapshots/use-get-snapshot-by-trade-setup";
import { useNavigate } from "@tanstack/react-router";
import { Doc, Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { useCallback, useMemo, useState } from "react";

// Constants
const TIMELINE_CONFIG = {
  MIN_SPACING_PERCENT: 5,
  TIMELINE_RANGE: 90, // 5% to 95%
  TIMELINE_START: 5,
  TIMELINE_END: 95,
  SINGLE_SNAPSHOT_POSITION: 50,
} as const;

// Types
interface Props {
  tradeSetupId: Id<"trade_setups">;
  snapshotId: Id<"snapshots">;
}

type SnapshotWithPosition = Doc<"snapshots"> & {
  position: number;
};

// Custom Hooks
function useSnapshotNavigation({
  tradeSetupId,
  snapshotId,
}: {
  tradeSetupId: Id<"trade_setups">;
  snapshotId: Id<"snapshots">;
}) {
  const navigate = useNavigate();
  const [loadingSnapshotId, setLoadingSnapshotId] =
    useState<Id<"snapshots"> | null>(null);

  const handleSnapshotClick = useCallback(
    async (targetSnapshotId: Id<"snapshots">) => {
      if (targetSnapshotId === snapshotId) return;

      setLoadingSnapshotId(targetSnapshotId);

      try {
        console.log(`Navigating to snapshot ${targetSnapshotId}`);

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
    },
    [navigate, tradeSetupId, snapshotId]
  );

  return { handleSnapshotClick, loadingSnapshotId };
}

function useSnapshotPositions(snapshots: Doc<"snapshots">[] | undefined) {
  return useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];

    // Single snapshot - center it
    if (snapshots.length === 1) {
      return [
        { ...snapshots[0], position: TIMELINE_CONFIG.SINGLE_SNAPSHOT_POSITION },
      ];
    }

    const earliestTime = Math.min(...snapshots.map((s) => s.createdAt));
    const latestTime = Math.max(...snapshots.map((s) => s.createdAt));
    const timeRange = latestTime - earliestTime;

    // Same creation time - distribute evenly
    if (timeRange === 0) {
      return distributeSnapshotsEvenly(snapshots);
    }

    // Different creation times - position based on timeline
    return positionSnapshotsByTime(snapshots, earliestTime, timeRange);
  }, [snapshots]);
}

// Helper functions for positioning
function distributeSnapshotsEvenly(
  snapshots: Doc<"snapshots">[]
): SnapshotWithPosition[] {
  const evenSpacing = TIMELINE_CONFIG.TIMELINE_RANGE / (snapshots.length - 1);
  const actualSpacing = Math.max(
    TIMELINE_CONFIG.MIN_SPACING_PERCENT,
    evenSpacing
  );

  return snapshots.map((snapshot, index) => ({
    ...snapshot,
    position: TIMELINE_CONFIG.TIMELINE_START + index * actualSpacing,
  }));
}

function positionSnapshotsByTime(
  snapshots: Doc<"snapshots">[],
  earliestTime: number,
  timeRange: number
): SnapshotWithPosition[] {
  // Calculate initial positions based on time
  let positions = snapshots.map((snapshot) => {
    const timeFromStart = snapshot.createdAt - earliestTime;
    const position =
      (timeFromStart / timeRange) * TIMELINE_CONFIG.TIMELINE_RANGE +
      TIMELINE_CONFIG.TIMELINE_START;
    return { ...snapshot, position };
  });

  // Sort by position for spacing adjustments
  positions.sort((a, b) => a.position - b.position);

  // Ensure minimum spacing between dots
  positions = adjustSpacing(positions);

  // Handle overflow beyond timeline end
  positions = handleOverflow(positions);

  // Restore chronological order
  return positions.sort((a, b) => a.createdAt - b.createdAt);
}

function adjustSpacing(
  positions: SnapshotWithPosition[]
): SnapshotWithPosition[] {
  for (let i = 1; i < positions.length; i++) {
    const prevPosition = positions[i - 1].position;
    const currentPosition = positions[i].position;

    if (currentPosition - prevPosition < TIMELINE_CONFIG.MIN_SPACING_PERCENT) {
      positions[i].position =
        prevPosition + TIMELINE_CONFIG.MIN_SPACING_PERCENT;
    }
  }
  return positions;
}

function handleOverflow(
  positions: SnapshotWithPosition[]
): SnapshotWithPosition[] {
  if (
    positions[positions.length - 1].position <= TIMELINE_CONFIG.TIMELINE_END
  ) {
    return positions;
  }

  // Compress proportionally to fit within timeline
  const compressionRatio =
    (TIMELINE_CONFIG.TIMELINE_RANGE -
      (positions.length - 1) * TIMELINE_CONFIG.MIN_SPACING_PERCENT) /
    TIMELINE_CONFIG.TIMELINE_RANGE;

  return positions.map((snapshot, index) => ({
    ...snapshot,
    position:
      TIMELINE_CONFIG.TIMELINE_START +
      index * TIMELINE_CONFIG.MIN_SPACING_PERCENT +
      (snapshot.position -
        TIMELINE_CONFIG.TIMELINE_START -
        index * TIMELINE_CONFIG.MIN_SPACING_PERCENT) *
        compressionRatio,
  }));
}

// Sub-components
function SnapshotDot({
  snapshot,
  isCurrentSnapshot,
  isLoading,
  onClick,
}: {
  snapshot: SnapshotWithPosition;
  isCurrentSnapshot: boolean;
  isLoading: boolean;
  onClick: () => void;
}) {
  const getDotClassName = () => {
    const baseClasses =
      "absolute top-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:size-4";

    if (isCurrentSnapshot) {
      return `${baseClasses} bg-green-500 border-2 border-green-600`;
    }

    if (isLoading) {
      return `${baseClasses} bg-blue-400 border-2 border-blue-500 animate-pulse`;
    }

    return `${baseClasses} bg-gray-500 border-2 border-gray-600 hover:bg-blue-400 hover:border-blue-500`;
  };

  return (
    <button
      className={getDotClassName()}
      style={{ left: `${snapshot.position}%` }}
      onClick={onClick}
      disabled={isLoading || isCurrentSnapshot}
    />
  );
}

function SnapshotTooltipContent({
  snapshot,
  isCurrentSnapshot,
  isLoading,
}: {
  snapshot: SnapshotWithPosition;
  isCurrentSnapshot: boolean;
  isLoading: boolean;
}) {
  const getStatusDotClassName = () => {
    const baseClasses = "w-2 h-2 rounded-full";

    if (isCurrentSnapshot) return `${baseClasses} bg-green-400`;
    if (isLoading) return `${baseClasses} bg-blue-400 animate-pulse`;
    return `${baseClasses} bg-gray-400`;
  };

  return (
    <TooltipContent
      side="top"
      sideOffset={10}
      className="bg-gradient-to-t from-background to-sidebar text-gray-100 border-muted rounded-none"
    >
      {/* Date line */}
      <div className="flex items-center space-x-2 font-mono">
        <div className={getStatusDotClassName()} />
        <span className="text-[11px] tracking-wide">
          {format(new Date(snapshot.createdAt), "MMM d, yyyy")}
        </span>
      </div>

      {/* Time and status line */}
      <div className="flex items-center space-x-2 font-mono mt-1">
        <div className="w-2 h-2" /> {/* Spacer */}
        <span className="text-[10px] text-gray-400">
          {format(new Date(snapshot.createdAt), "HH:mm:ss")} •{" "}
          <span className="capitalize">{snapshot.status}</span>
        </span>
      </div>

      {/* Status indicator line */}
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
  );
}

// Main Component
const SnapshotHistory = ({ snapshotId, tradeSetupId }: Props) => {
  const { data: snapshots } = useGetSnapshotByTradeSetupId({
    tradeSetupId: tradeSetupId as Id<"trade_setups">,
    sortBy: "createdAt",
    sortOrder: "asc",
  });

  const { handleSnapshotClick, loadingSnapshotId } = useSnapshotNavigation({
    tradeSetupId,
    snapshotId,
  });

  const sortedSnapshots = useSnapshotPositions(snapshots);

  return (
    <TooltipProvider>
      <div className="w-full h-12 relative px-4">
        {/* Timeline line */}
        <div className="absolute top-1/2 left-4 right-4 h-px bg-muted transform -translate-y-1/2 mask-x-from-95%" />

        {/* Snapshot dots */}
        {sortedSnapshots.map((snapshot) => {
          const isCurrentSnapshot = snapshot._id === snapshotId;
          const isLoading = loadingSnapshotId === snapshot._id;

          return (
            <Tooltip key={snapshot._id}>
              <TooltipTrigger asChild>
                <SnapshotDot
                  snapshot={snapshot}
                  isCurrentSnapshot={isCurrentSnapshot}
                  isLoading={isLoading}
                  onClick={() => handleSnapshotClick(snapshot._id)}
                />
              </TooltipTrigger>
              <SnapshotTooltipContent
                snapshot={snapshot}
                isCurrentSnapshot={isCurrentSnapshot}
                isLoading={isLoading}
              />
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default SnapshotHistory;
