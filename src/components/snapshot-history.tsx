import { useGetSnapshotByTradeSetupId } from "@/hooks/snapshots/use-get-snapshot-by-trade-setup";
import {
  SnapshotWithPosition,
  useSnapshotNavigation,
  useSnapshotPositions,
} from "@/hooks/snapshots/use-snapshot-navigation";
import { cn } from "@/lib/utils";
import clsx from "clsx";
import { Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

// Types
interface Props {
  tradeSetupId: Id<"trade_setups">;
  snapshotId: Id<"snapshots">;
  image?: "preview";
  className?: string;
}

// Sub-components

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
    const baseClasses = "w-2.5 h-2.5 rounded-full shadow-sm";

    if (isCurrentSnapshot)
      return `${baseClasses} bg-green-500 border border-green-600`;
    if (isLoading)
      return `${baseClasses} bg-blue-500 border border-blue-600 animate-pulse`;
    return `${baseClasses} bg-gray-400 border border-gray-500`;
  };

  return (
    <TooltipContent
      sideOffset={20}
      className={clsx(
        "bg-gradient-to-t from-background to-sidebar text-gray-100 border-muted rounded-none"
      )}
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
const SnapshotHistory = ({
  snapshotId,
  tradeSetupId,
  className,
  image,
}: Props) => {
  const { data: snapshots } = useGetSnapshotByTradeSetupId({
    tradeSetupId: tradeSetupId as Id<"trade_setups">,
    sortBy: "createdAt",
    sortOrder: "asc",
  });

  const { handleSnapshotClick, loadingSnapshotId } = useSnapshotNavigation({
    tradeSetupId,
    snapshotId,
    image,
  });

  const sortedSnapshots = useSnapshotPositions(snapshots);

  return (
    // <TooltipProvider>
    <div className={cn("w-full h-12 relative px-4 shrink-0", className)}>
      {/* Timeline line */}
      <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-muted transform -translate-y-1/2 shadow-sm" />

      {/* Snapshot dots */}
      {sortedSnapshots.map((snapshot) => {
        const isCurrentSnapshot = snapshot._id === snapshotId;
        const isLoading = loadingSnapshotId === snapshot._id;

        return (
          <div
            key={snapshot._id}
            className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${snapshot.position}%` }}
          >
            <Tooltip>
              <TooltipTrigger
                className={`absolute top-1/2 size-3 rounded-full items-center justify-center flex transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:shadow-lg before:absolute before:inset-0 before:rounded-full before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100 ${
                  isCurrentSnapshot
                    ? "border border-emerald-500 bg-background size-4 border-green-500 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 before:bg-green-500/20 before:shadow-lg before:shadow-green-500/50"
                    : isLoading
                      ? "border border-blue-500 bg-background shadow-lg animate-pulse hover:shadow-xl"
                      : "bg-background border hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-400/30 before:bg-emerald-400/20 before:shadow-lg before:shadow-emerald-400/30"
                }`}
                onClick={() => handleSnapshotClick(snapshot._id)}
                disabled={isLoading || isCurrentSnapshot}
              />

              <SnapshotTooltipContent
                snapshot={snapshot}
                isCurrentSnapshot={isCurrentSnapshot}
                isLoading={isLoading}
              />
            </Tooltip>
          </div>
        );
      })}
    </div>
    // </TooltipProvider>
  );
};

export default SnapshotHistory;
