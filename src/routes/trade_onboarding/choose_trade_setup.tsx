import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { statusOptions } from "@/config/constants";
import { useGetMostRecentSnapshot } from "@/hooks/snapshots/use-get-most-recent-snapshot";
import { useGetTradeSetups } from "@/hooks/trade-setup/use-get-trade-setups";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { Doc, Id } from "convex/_generated/dataModel";
import { format, formatDistanceToNow } from "date-fns";
import { CalendarIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  imageId: z.optional(
    z.custom<Id<"tradingview_images">>((val) => typeof val === "string")
  ),
  asset: z.string(),
});

export const Route = createFileRoute("/trade_onboarding/choose_trade_setup")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function RouteComponent() {
  const { imageId, asset } = Route.useSearch();
  const { data: tradeSetups, isLoading } = useGetTradeSetups({ asset });
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Left-side trade setup list */}
      <div className="absolute left-[10%] right-[60%] top-[20%] bottom-[20%] pointer-events-auto">
        {/* Command component for filtering */}
        <div className="p-4 border-muted font-mono">
          <h2 className="text-lg font-semibold mb-3">Attach to Trade Setup</h2>
          <Command className="rounded-lg border shadow-md">
            <CommandInput
              placeholder="Search trade setups..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>No trade setups found.</CommandEmpty>
              <CommandGroup>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">
                      Loading trade setups...
                    </div>
                  </div>
                ) : (
                  tradeSetups?.map((tradeSetup) => (
                    <CommandItem key={tradeSetup._id}>
                      <TradeSetupCard
                        tradeSetup={tradeSetup}
                        imageId={imageId as Id<"tradingview_images">}
                      />
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </div>
    </div>
  );
}

function TradeSetupCard({
  tradeSetup,
  imageId,
}: {
  tradeSetup: Doc<"trade_setups"> & { snapshotId?: string; status?: string };
  imageId: Id<"tradingview_images">;
}) {
  const navigate = useNavigate();

  const { data: snapshot } = useGetMostRecentSnapshot({
    tradeSetupId: tradeSetup._id,
  });

  async function handleSubmit() {
    // Navigate to attach_trade  with attach=true and the trade setup's snapshot
    navigate({
      to: "/trade_onboarding/attach_trade",
      search: {
        tradeSetupId: tradeSetup._id,
        snapshotId: snapshot?._id,
        imageId,
      },
    });
  }

  const createdAt = new Date(tradeSetup._creationTime);

  // Get status color from statusOptions
  const statusOption = statusOptions.find(
    (option) => option.value === tradeSetup.status
  );

  // Get direction icon and color
  const DirectionIcon =
    tradeSetup.direction === "long" ? TrendingUpIcon : TrendingDownIcon;
  const directionColor =
    tradeSetup.direction === "long" ? "text-emerald-400" : "text-rose-400";

  return (
    <button
      className={clsx(
        "flex items-center gap-3 p-3 w-full cursor-pointer hover:bg-muted/50 transition-colors"
      )}
      onClick={handleSubmit}
    >
      {/* Direction indicator */}
      <div className={clsx("flex-shrink-0", directionColor)}>
        <DirectionIcon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-sm line-clamp-1">
            {tradeSetup.title || "Untitled"}
          </h3>
          {statusOption && (
            <span
              className={clsx(
                "px-1.5 py-0.5 text-xs rounded-sm border font-mono",
                statusOption.color
              )}
            >
              {statusOption.label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">{tradeSetup.asset}</span>

          {tradeSetup.timeframes && tradeSetup.timeframes.length > 0 && (
            <span className="font-mono">
              {tradeSetup.timeframes.join(", ")}
            </span>
          )}

          {snapshot?.riskReward && (
            <span className="font-mono">R/R: {snapshot.riskReward}</span>
          )}
        </div>

        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <CalendarIcon className="w-3 h-3 mr-1" />
          <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
          <span className="mx-2">•</span>
          <span>{format(createdAt, "MMM d, yyyy")}</span>
        </div>
      </div>
    </button>
  );
}
