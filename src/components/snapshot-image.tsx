import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { useGetSnapshotByTradeSetupId } from "@/hooks/snapshots/use-get-snapshot-by-trade-setup";
import { useGetImage } from "@/hooks/tradingview_images/get_image";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface SnapshotImageProps {
  snapshotId: string;
  tradeSetupId: string;
  initialFullscreen?: boolean;
  className?: string;
}

export function SnapshotImage({
  snapshotId,
  tradeSetupId,
  initialFullscreen = false,
  className,
}: SnapshotImageProps) {
  const navigate = useNavigate();

  const { data: snapshot, isLoading: isLoadingSnapshot } = useGetSnapshot({
    id: snapshotId as Id<"snapshots">,
  });

  const { data: image, isLoading: isLoadingImage } = useGetImage({
    id: snapshot?.imageId as Id<"tradingview_images">,
  });

  // Get all snapshots for this trade setup to enable navigation
  const { data: allSnapshots, isLoading: isLoadingAllSnapshots } =
    useGetSnapshotByTradeSetupId({
      tradeSetupId: tradeSetupId as Id<"trade_setups">,
      sortBy: "createdAt",
      sortOrder: "asc", // ascending to get chronological order
    });

  const isLoading =
    isLoadingSnapshot || isLoadingImage || isLoadingAllSnapshots;

  // Find current snapshot index and determine previous/next snapshots
  const currentIndex =
    allSnapshots?.findIndex((s) => s._id === snapshotId) ?? -1;
  const previousSnapshot =
    currentIndex > 0 ? allSnapshots?.[currentIndex - 1] : null;
  const nextSnapshot =
    currentIndex >= 0 && currentIndex < (allSnapshots?.length ?? 0) - 1
      ? allSnapshots?.[currentIndex + 1]
      : null;

  if (isLoading) {
    return (
      <div
        className={cn(
          "w-full h-full rounded-lg flex items-center justify-center",
          className
        )}
      >
        <span className="text-muted-foreground font-mono text-sm">
          Loading image...
        </span>
      </div>
    );
  }

  if (!image?.url) {
    return (
      <div
        className={cn(
          "w-full h-full rounded-lg flex items-center justify-center",
          className
        )}
      >
        <span className="text-muted-foreground font-mono text-sm">
          No image available
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Regular image view */}
      <div
        className={cn(
          "relative w-full @[110px]:h-full rounded-lg overflow-hidden group",
          className
        )}
      >
        <img
          src={image.url}
          alt="Trading setup chart"
          className="w-full h-full object-contain cursor-pointer transition-opacity"
          onClick={() =>
            navigate({
              to: "/dashboard/setup",
              search: { tradeSetupId, snapshotId, fullscreen: true },
            })
          }
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        />

        {/* Navigation arrows - only show on hover */}
        {previousSnapshot && (
          <Link
            to="/dashboard/setup"
            search={{ tradeSetupId, snapshotId: previousSnapshot._id }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}

        {nextSnapshot && (
          <Link
            to="/dashboard/setup"
            search={{ tradeSetupId, snapshotId: nextSnapshot._id }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Fullscreen overlay */}
      {initialFullscreen && (
        <div
          className="fixed inset-0 border z-50 bg-black/90  flex items-center justify-center p-4 animate-in fade-in-0 duration-300"
          onClick={() =>
            navigate({
              to: "/dashboard/setup",
              search: { tradeSetupId, snapshotId },
            })
          }
        >
          {/* Close button */}
          <button
            onClick={() =>
              navigate({
                to: "/dashboard/setup",
                search: { tradeSetupId, snapshotId },
              })
            }
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all duration-200 hover:scale-110"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Fullscreen image */}
          <div
            className="absolute inset-50 animate-in zoom-in-95 duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={image.url}
              alt="Trading setup chart - Fullscreen"
              className="w-full h-full object-contain rounded-lg"
            />

            {/* Fullscreen navigation arrows */}
            {previousSnapshot && (
              <Link
                to="/dashboard/setup"
                search={{
                  tradeSetupId,
                  snapshotId: previousSnapshot._id,
                  fullscreen: true,
                }}
                preload="render"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all duration-200 z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </Link>
            )}

            {nextSnapshot && (
              <Link
                to="/dashboard/setup"
                preload="render"
                search={{
                  tradeSetupId,
                  snapshotId: nextSnapshot._id,
                  fullscreen: true,
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all duration-200 z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
