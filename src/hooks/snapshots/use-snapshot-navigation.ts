import { useNavigate } from "@tanstack/react-router";
import { Doc, Id } from "convex/_generated/dataModel";
import { useCallback, useMemo, useState } from "react";

export type SnapshotWithPosition = Doc<"snapshots"> & {
  position: number;
};

// Constants
const TIMELINE_CONFIG = {
  MIN_SPACING_PERCENT: 5,
  TIMELINE_RANGE: 90, // 5% to 95%
  TIMELINE_START: 5,
  TIMELINE_END: 95,
  SINGLE_SNAPSHOT_POSITION: 50,
} as const;

// Custom Hooks
export function useSnapshotNavigation({
  tradeSetupId,
  snapshotId,
  image,
}: {
  tradeSetupId: Id<"trade_setups">;
  snapshotId: Id<"snapshots">;
  image?: "preview";
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
          search: { tradeSetupId, snapshotId: targetSnapshotId, image },
        });

        console.log(`Successfully navigated to snapshot ${targetSnapshotId}`);
      } catch (error) {
        console.error("Failed to load snapshot:", error);
      } finally {
        setLoadingSnapshotId(null);
      }
    },
    [snapshotId, navigate, tradeSetupId, image]
  );

  return { handleSnapshotClick, loadingSnapshotId };
}

export function useSnapshotPositions(
  snapshots: Doc<"snapshots">[] | undefined
) {
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
