import { Button } from "@/components/ui/button";
import { statusOptions } from "@/config/constants";
import { Timeframe, timeframeOrder } from "@/config/timeframe-order";
import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { useCreateTradeSetup } from "@/hooks/trade-setup/use-create-trade-setup";
import { useGetTradeSetupBySnapshotId } from "@/hooks/trade-setup/use-get-trade-setup-by-image-id";
import { useUpdateTradeSetup } from "@/hooks/trade-setup/use-update-trade-setup";
import { useGetImage } from "@/hooks/tradingview_images/get_image";
import { addTradeSetupSchema } from "@/schemas/add_trade_setup";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { useState } from "react";
import { z } from "zod";

const searchSchema = z.object({
  imageId: z.string(),
  snapshotId: z.optional(z.string()),
});

const directionOptions = [
  {
    value: "long",
    label: "Long",
    color: "border-emerald-400/70 bg-emerald-500/5 text-emerald-300/80",
  },
  {
    value: "short",
    label: "Short",
    color: "border-rose-400/70 bg-rose-500/5 text-rose-300/80",
  },
] as const;

// Helper function to sort timeframes according to timeframeOrder
const sortTimeframes = (timeframes: string[]) => {
  return [...timeframes].sort((a, b) => {
    const indexA = timeframeOrder.indexOf(a as Timeframe);
    const indexB = timeframeOrder.indexOf(b as Timeframe);
    return indexA - indexB;
  });
};

export const Route = createFileRoute("/trade_onboarding/add_trade")({
  component: RouteComponent,
  validateSearch: searchSchema,
  // Use pendingComponent to show loading state while data loads
  pendingComponent: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-muted-foreground font-mono text-sm">Loading...</div>
    </div>
  ),
});

function RouteComponent() {
  const { imageId, snapshotId } = Route.useSearch();
  const { data, isLoading: isLoadingImage } = useGetImage({ id: imageId });
  const { data: existingTradeSetup, isLoading: isLoadingTradeSetup } =
    useGetTradeSetupBySnapshotId({
      snapshotId: snapshotId as Id<"snapshots">,
    });

  const { data: existingSnapshot, isLoading: isLoadingSnapshot } =
    useGetSnapshot({ id: snapshotId as Id<"snapshots"> });

  const { mutateAsync: createTradeSetup, isPending: isPendingSubmit } =
    useCreateTradeSetup({
      onSuccess: ({ tradeSetupId, snapshotId }) => {
        navigate({
          to: "/trade_onboarding/add_template",
          search: {
            tradeSetupId: tradeSetupId,
            imageId: imageId,
            snapshotId,
          },
        });
      },
    });
  const { mutateAsync: updateTradeSetup, isPending: isPendingUpdate } =
    useUpdateTradeSetup({
      onSuccess: ({ snapshotId, tradeSetupId }) => {
        navigate({
          to: "/trade_onboarding/add_template",
          search: {
            tradeSetupId,
            imageId: imageId,
            snapshotId,
          },
        });
      },
    });

  const isPending = isPendingSubmit || isPendingUpdate;
  const isLoading = isLoadingImage || isLoadingTradeSetup || isLoadingSnapshot;
  const navigate = useNavigate();

  // State for managing the add timeframe input
  const [isAddingTimeframe, setIsAddingTimeframe] = useState(false);
  const [newTimeframe, setNewTimeframe] = useState("");

  // Initialize form with react-hook-form - now with proper default values
  const form = useForm({
    validators: {
      onSubmit: addTradeSetupSchema,
    },
    defaultValues: {
      title: existingTradeSetup?.title || "",
      status: existingSnapshot?.status || "idea",
      direction: existingTradeSetup?.direction || "long",
      riskReward: existingTradeSetup?.riskReward ?? undefined,
      timeframes: existingTradeSetup?.timeframes || ["4h"],
    },
    onSubmit: async ({ value: formData }) => {
      // Do something with the values passed via handleSubmit
      if (existingTradeSetup) {
        await updateTradeSetup({
          ...formData,
          id: existingTradeSetup._id,
          snapshotId: snapshotId as Id<"snapshots">,
        });
      } else {
        // Create a new trade setup with the form data
        await createTradeSetup({
          ...formData,
          asset: data?.asset || "Unknown",
          imageId: imageId as Id<"tradingview_images">, // Link to the current image
        });
      }
    },
  });

  // Check if current input is a valid timeframe
  function isValidTimeframe(newTimeframe: string): boolean {
    return newTimeframe.trim()
      ? timeframeOrder.includes(newTimeframe.trim() as Timeframe)
      : true;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Right-side form panel - opposite to the centered AnimatedImageLayout */}
      <div className="absolute left-[60%] right-[10%] top-[20%] bottom-[40%] h-auto max-h-[70vh] max-w-[25vw] pointer-events-auto">
        <div className="w-full flex flex-col border-b-[1px] -space-y-1 py-2 font-mono text-xs">
          {/* Title Input */}

          {/* Asset (read-only) */}
          <div className="flex justify-between items-center h-9">
            <span className="text-xs text-muted">Asset</span>
            <span className="text-muted-foreground">{data?.asset}</span>
          </div>

          {/* Timeframe */}
          <div className="flex justify-between items-center h-9">
            <span className="text-xs text-muted">Timeframe</span>
            <span className="text-muted-foreground">4H (placeholder)</span>
          </div>

          {/* Current Time */}
          <div className="flex justify-between items-center h-9">
            <span className="text-xs text-muted">Creation Time</span>
            <span className="text-muted-foreground">
              {data?._creationTime &&
                format(new Date(data._creationTime), "HH:mm")}
            </span>
          </div>
        </div>
        <form
          className="font-mono"
          aria-disabled={isLoading}
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <fieldset
            disabled={isLoading || isPending}
            className="disabled:opacity-50 disabled:!cursor-default disabled:!pointer-events-none"
          >
            <form.Field
              name="title"
              children={(field) => (
                <div className="flex justify-between items-center h-9">
                  <label className="text-xs text-muted" htmlFor={field.name}>
                    Title
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="text-emerald-500 placeholder:text-emerald-500/60 border-none !bg-transparent !font-mono !text-xs text-end !p-0 w-fit !outline-0 !ring-0 focus-visible:underline !m-0"
                    placeholder="Phoenix"
                  />
                </div>
              )}
            />

            {/* Direction Buttons */}
            <div className="flex justify-between items-center h-9">
              <span className="text-xs text-muted">Direction</span>

              <form.Field
                name="direction"
                children={(field) => (
                  <div className="flex flex-row gap-1">
                    {directionOptions.map((option) => {
                      const isSelected = field.state.value === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.handleChange(option.value)}
                          className={`px-1 py-0.5 border font-mono text-xs rounded-sm transition-all cursor-pointer ${
                            isSelected
                              ? option.color
                              : "border-muted text-muted-foreground hover:border-muted-foreground/50"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            {/* Status Badges */}
            <div className="flex justify-between items-center h-9">
              <span className="text-xs text-muted">Status</span>

              <form.Field
                name="status"
                children={(field) => (
                  <div className="flex flex-row gap-1.5">
                    {statusOptions.map((option) => {
                      const isSelected = field.state.value === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.handleChange(option.value)}
                          className={`px-1 py-0.5 border font-mono text-xs rounded-sm transition-all cursor-pointer ${
                            isSelected
                              ? option.color
                              : "border-muted text-muted-foreground hover:border-muted-foreground/50"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            {/* Timeframes */}
            <div className="flex justify-between items-center h-9">
              <span className="text-xs text-muted">Timeframes</span>

              <form.Field
                name="timeframes"
                children={(field) => (
                  <div className="flex flex-row gap-1">
                    {sortTimeframes(field.state.value).map((timeframe) => (
                      <button
                        key={timeframe}
                        type="button"
                        onClick={() =>
                          field.handleChange(
                            field.state.value.filter((tf) => tf !== timeframe)
                          )
                        }
                        className="px-1 py-0.5 border border-muted text-muted-foreground font-mono text-xs rounded-sm transition-all cursor-pointer hover:border-red-400/50 hover:text-red-400/70"
                        title="Click to remove"
                      >
                        {timeframe}
                      </button>
                    ))}

                    {/* Add timeframe button/input */}
                    {isAddingTimeframe ? (
                      <input
                        value={newTimeframe}
                        onChange={(e) => setNewTimeframe(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (
                              newTimeframe.trim() !== "" &&
                              !field.state.value.includes(newTimeframe)
                            ) {
                              field.handleChange([
                                ...field.state.value,
                                newTimeframe,
                              ]);
                            }
                            setNewTimeframe("");
                            setIsAddingTimeframe(false);
                          }
                        }}
                        onBlur={() => {
                          if (
                            newTimeframe.trim() !== "" &&
                            !field.state.value.includes(newTimeframe)
                          ) {
                            field.handleChange([
                              ...field.state.value,
                              newTimeframe,
                            ]);
                          }
                          setNewTimeframe("");
                          setIsAddingTimeframe(false);
                        }}
                        autoFocus
                        className={`w-10 h-6 px-1 py-0.5 border font-mono text-xs rounded-sm bg-transparent !outline-none ${
                          isValidTimeframe(newTimeframe)
                            ? "border-muted text-muted-foreground"
                            : "border-red-400/70 text-red-400"
                        }`}
                        placeholder="4h"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingTimeframe(true)}
                        className="px-1 py-0.5 border border-muted text-muted-foreground font-mono text-xs rounded-sm transition-all cursor-pointer hover:border-muted-foreground/50 hover:text-muted-foreground/80"
                        title="Add timeframe"
                      >
                        +
                      </button>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Risk/Reward Input */}
            <div className="flex justify-between items-center h-9">
              <span className="text-xs text-muted">Risk / Reward</span>

              <form.Field
                name="riskReward"
                children={(field) => (
                  <>
                    <input
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="text-muted-foreground placeholder:text-muted border-none !bg-transparent !font-mono !text-xs text-end !p-0 w-fit !outline-0 !ring-0 focus-visible:underline !m-0"
                      placeholder="3:2"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <div className="flex justify-end">
                        <span className="text-red-400 text-xs">
                          {field.state.meta.errors.join(", ")}
                        </span>
                      </div>
                    )}
                  </>
                )}
              />
            </div>

            <Button
              type="submit"
              className="absolute bottom-0 right-0 duration-500 ease-out font-mono tracking-wide leading-3"
              disabled={isPending || form.state.isSubmitting}
            >
              {isPending || form.state.isSubmitting
                ? existingTradeSetup
                  ? "Updating..."
                  : "Creating..."
                : "Proceed"}
            </Button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
