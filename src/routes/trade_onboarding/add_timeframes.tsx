import { Button } from "@/components/ui/button";
import { useAddTimeframeCouples } from "@/hooks/trade-setup/use-add-timeframe-couples";
import { useGetTradeSetup } from "@/hooks/trade-setup/use-get-trade-setup";
import { getTagDisplayName } from "@/rjsf/strategy.form.schema";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { Id } from "convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  tradeSetupId: z.string(),
  imageId: z.string(),
});

export const Route = createFileRoute("/trade_onboarding/add_timeframes")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

const ACTIVE_KEYS = ["obim", "swing", "fractal", "supply", "demand", "range"];

// Helper function to get active tags from trade setup
function getActiveTags(tags: Record<string, unknown> | undefined): string[] {
  if (!tags) return [];
  return Object.entries(tags)
    .filter(([key, value]) => Boolean(value) && ACTIVE_KEYS.includes(key))
    .map(([key]) => key);
}

function RouteComponent() {
  const { tradeSetupId } = Route.useSearch();
  const { data: tradeSetup } = useGetTradeSetup({
    id: tradeSetupId as Id<"trade_setups">,
  });
  const navigate = useNavigate();
  const [selectedTimeframes, setSelectedTimeframes] = useState<
    Record<string, string>
  >({});

  const { mutateAsync: addTimeframeCouples, isPending } =
    useAddTimeframeCouples();

  const activeTags = getActiveTags(tradeSetup?.tags);

  useEffect(() => {
    if (!tradeSetup?.timeframeTagCouples) return;
    // If tradeSetup has existing timeframes data, populate the state
    if (typeof tradeSetup.timeframeTagCouples === "object") {
      setSelectedTimeframes(
        tradeSetup.timeframeTagCouples as Record<string, string>
      );
    }
  }, [tradeSetup?.timeframeTagCouples]);

  const handleTimeframeSelect = (activeTag: string, timeframe: string) => {
    setSelectedTimeframes((prev) => ({
      ...prev,
      [activeTag]: prev[activeTag] === timeframe ? "" : timeframe, // Toggle off if same timeframe clicked
    }));
  };

  const onSubmit = async () => {
    // TODO: Create hook to add timeframes to trade setup
    console.log("Timeframes to save:", selectedTimeframes);
    await addTimeframeCouples({
      id: tradeSetupId as Id<"trade_setups">,
      timeframeTagCouples: selectedTimeframes,
    });
    // For now, just navigate back
    navigate({ to: "/" });
  };

  if (!tradeSetup) {
    return <div>Loading trade setup...</div>;
  }

  if (activeTags.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white font-mono">
          No active tags found. Please add tags first.
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Right-side form panel - opposite to the centered AnimatedImageLayout */}
      <div className="absolute right-[60%] left-[10%] top-[20%] bottom-[40%] h-auto max-h-[70vh] max-w-[25vw] pointer-events-auto">
        <div className="w-full flex flex-col border-b-[1px] -space-y-1 py-2 font-mono text-xs">
          {activeTags.map((activeTag) => (
            <div
              key={activeTag}
              className="flex justify-between items-center h-9"
            >
              <span className="text-muted-foreground font-light ">
                {getTagDisplayName(activeTag)}
              </span>
              <div className="flex gap-1">
                {tradeSetup.timeframes?.map((timeframe) => {
                  const isSelected =
                    selectedTimeframes[activeTag] === timeframe;
                  return (
                    <button
                      key={timeframe}
                      type="button"
                      onClick={() =>
                        handleTimeframeSelect(activeTag, timeframe)
                      }
                      className={clsx(
                        "px-1 py-0.5 border font-mono text-xs rounded-sm transition-all cursor-pointer",
                        {
                          // Selected state
                          "border-muted-foreground text-white bg-background":
                            isSelected,
                          // Unselected state
                          "border-muted text-muted-foreground hover:border-muted-foreground/50":
                            !isSelected,
                        }
                      )}
                    >
                      {timeframe}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="absolute right-[10%] bottom-[20%] pointer-events-auto">
            <Button
              className="duration-500 ease-out font-mono tracking-wide leading-3"
              onClick={onSubmit}
              disabled={isPending}
            >
              {isPending ? "Loading..." : "Complete"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
