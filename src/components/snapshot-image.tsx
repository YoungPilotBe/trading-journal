import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useGetSnapshotByTradeSetupId } from "@/hooks/snapshots/use-get-snapshot-by-trade-setup";
import { useGetImageBySnapshot } from "@/hooks/tradingview_images/use-get-image-by-snapshot";
import { cn } from "@/lib/utils";
import { isRasp } from "@/utils/env-utils";
import { Link, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { Id } from "convex/_generated/dataModel";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";
import SnapshotHistory from "./snapshot-history";

interface SnapshotImageProps {
  snapshotId: Id<"snapshots">;
  tradeSetupId: Id<"trade_setups">;
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

  const { data: image, isLoading: isLoadingImage } = useGetImageBySnapshot({
    snapshotId,
  });

  useEffect(() => {
    console.log({ snapshotId, tradeSetupId });
  }, [snapshotId, tradeSetupId]);

  // Get all snapshots for this trade setup to enable navigation
  const { data: allSnapshots, isLoading: isLoadingAllSnapshots } =
    useGetSnapshotByTradeSetupId({
      tradeSetupId: tradeSetupId as Id<"trade_setups">,
      sortBy: "createdAt",
      sortOrder: "asc", // ascending to get chronological order
    });

  const isLoading = isLoadingImage || isLoadingAllSnapshots;

  // Find current snapshot index and determine previous/next snapshots
  const currentIndex =
    allSnapshots?.findIndex((s) => s._id === snapshotId) ?? -1;
  const previousSnapshot =
    currentIndex > 0 ? allSnapshots?.[currentIndex - 1] : null;
  const nextSnapshot =
    currentIndex >= 0 && currentIndex < (allSnapshots?.length ?? 0) - 1
      ? allSnapshots?.[currentIndex + 1]
      : null;

  return (
    <>
      {/* Regular image view */}
      <div
        className={cn(
          "relative w-full @[110px]:h-full rounded-lg overflow-y-auto h-full group",
          className
        )}
      >
        <LoadingSkeleton
          isLoading={isLoading || !image?.url}
          className="h-full aspect-video"
        >
          <img
            src={image?.url ?? undefined}
            alt="Trading setup chart"
            className="w-full h-full object-contain cursor-pointer transition-opacity"
            onClick={() =>
              navigate({
                to: "/dashboard/setup",
                search: { tradeSetupId, snapshotId, image: "preview" },
                replace: true,
              })
            }
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />

          {/* Navigation arrows - only show on hover */}
          {previousSnapshot && (
            <Link
              to="/dashboard/setup"
              search={{ tradeSetupId, snapshotId: previousSnapshot._id }}
              replace
              className={clsx(
                "absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10",
                {
                  "!opacity-100": isRasp,
                }
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          )}

          {nextSnapshot && (
            <Link
              to="/dashboard/setup"
              search={{ tradeSetupId, snapshotId: nextSnapshot._id }}
              preload="render"
              className={clsx(
                "absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10",
                {
                  "!opacity-100": isRasp,
                }
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </LoadingSkeleton>
      </div>

      {/* Fullscreen overlay */}
      {initialFullscreen && (
        <>
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
              className={clsx(
                "absolute inset-50 animate-in zoom-in-95 duration-300 ease-out",
                {
                  "!inset-20": isRasp,
                }
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <SnapshotHistory
                snapshotId={snapshotId}
                tradeSetupId={tradeSetupId}
                image="preview"
                className="absolute -translate-y-full w-[80%] -translate-x-1/2 left-1/2"
              />
              <img
                src={image?.url ?? undefined}
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
                    image: "preview",
                  }}
                  preload="render"
                  className={clsx(
                    "absolute text-white transition-all duration-200 z-10 flex items-center justify-center",
                    {
                      "left-0 top-0 bottom-0 w-20 bg-neutral-800/60 hover:bg-neutral-700/50":
                        isRasp,
                      "left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 p-3 rounded-full":
                        !isRasp,
                    }
                  )}
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
                    image: "preview",
                  }}
                  className={clsx(
                    "absolute text-white transition-all duration-200 z-10 flex items-center justify-center",
                    {
                      "right-0 top-0 bottom-0 w-20 bg-neutral-800/60 hover:bg-neutral-700/50":
                        isRasp,
                      "right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 p-3 rounded-full":
                        !isRasp,
                    }
                  )}
                >
                  <ChevronRight className="h-6 w-6" />
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
