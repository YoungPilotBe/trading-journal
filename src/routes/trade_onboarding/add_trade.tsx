import StatusOptions from "@/components/status-options";
import { Button } from "@/components/ui/button";
import { statusOptions } from "@/config/constants";
import { Timeframe, TIMEFRAMES } from "@/config/timeframe-order";
import { useGenerateSmartTitle } from "@/hooks/base_titles/use-generate-smart-title";
import { useCreateSnapshot } from "@/hooks/snapshots/use-create-snapshot";
import { useGetPreviousStatuses } from "@/hooks/snapshots/use-get-previous-statuses";
import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { useCreateTradeSetup } from "@/hooks/trade-setup/use-create-trade-setup";
import { useGetTradeSetupBySnapshotId } from "@/hooks/trade-setup/use-get-trade-setup-by-image-id";
import { useUpdateTradeSetup } from "@/hooks/trade-setup/use-update-trade-setup";
import { useGetImage } from "@/hooks/tradingview_images/get_image";
import { addTradeSetupSchema, resultSchema } from "@/schemas/add_trade_setup";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

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

const resultOptions = [
  {
    value: "win",
    label: "Win",
    color: "border-emerald-400/70 bg-emerald-500/5 text-emerald-300/80",
  },
  {
    value: "loss",
    label: "Loss",
    color: "border-red-400/70 bg-red-500/5 text-red-300/80",
  },
  {
    value: "breakeven",
    label: "Breakeven",
    color: "border-yellow-400/70 bg-yellow-500/5 text-yellow-300/80",
  },
] as const;

// Helper function to sort timeframes according to timeframeOrder
const sortTimeframes = (timeframes: string[]) => {
  return [...timeframes].sort((a, b) => {
    const indexA = TIMEFRAMES.indexOf(a as Timeframe);
    const indexB = TIMEFRAMES.indexOf(b as Timeframe);
    return indexA - indexB;
  });
};

const searchSchema = z.object({
  tradeSetupId: z.optional(z.string()),
  snapshotId: z.optional(z.string()),
  image: z.optional(z.enum(["preview"])),
  attach: z.optional(z.boolean()),
  onboarding: z.optional(z.boolean()),
});

export const Route = createFileRoute("/trade_onboarding/add_trade")({
  component: RouteComponent,
  validateSearch: searchSchema,
  // Use pendingComponent to show loading state while data loads
  pendingComponent: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-muted-foreground font-mono text-sm">Loading...</div>
    </div>
  ),
  beforeLoad(ctx) {
    console.log(ctx);
  },
});

function RouteComponent() {
  const { imageId, snapshotId, attach } = Route.useSearch();
  // attach parameter indicates this is an attachment flow from existing trade setup
  const { data, isLoading: isLoadingImage } = useGetImage({
    id: imageId as Id<"tradingview_images">,
  });
  const { data: existingTradeSetup, isLoading: isLoadingTradeSetup } =
    useGetTradeSetupBySnapshotId({
      snapshotId: snapshotId as Id<"snapshots">,
    });

  const { data: smartTitle, isPending: isPendingGeneratingSmartTitle } =
    useGenerateSmartTitle({});

  const { data: existingSnapshot, isLoading: isLoadingSnapshot } =
    useGetSnapshot({ id: snapshotId as Id<"snapshots"> });

  // Get previous statuses for chronological validation
  const { data: previousStatuses = [] } = useGetPreviousStatuses({
    tradeSetupId: existingTradeSetup?._id,
  });

  const { mutateAsync: createTradeSetup, isPending: isPendingSubmit } =
    useCreateTradeSetup({
      onSuccess: ({ tradeSetupId, snapshotId }) => {
        navigate({
          to: "/trade_onboarding/add_template",
          search: {
            tradeSetupId: tradeSetupId,
            imageId,
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
            imageId,
            snapshotId,
          },
        });
      },
    });

  const { mutateAsync: createSnapshot, isPending: isPendingSnapshot } =
    useCreateSnapshot({
      onSuccess: ({ snapshotId, tradeSetupId }) => {
        navigate({
          to: "/trade_onboarding/add_tags",
          from: "/trade_onboarding/add_trade",
          replace: true,
          search: {
            tradeSetupId,
            imageId,
            snapshotId,
          },
        });
      },
    });

  const isPending = isPendingSubmit || isPendingUpdate || isPendingSnapshot;
  const isLoading = isLoadingImage || isLoadingTradeSetup || isLoadingSnapshot;
  const navigate = useNavigate();

  // State for managing the add timeframe input
  const [isAddingTimeframe, setIsAddingTimeframe] = useState(false);
  const [newTimeframe, setNewTimeframe] = useState("");

  // Initialize form with react-hook-form - now with proper default values
  const form = useForm({
    validators: {
      onChange: ({ value }) => {
        console.log("Validating", value);

        // First validate with the schema
        const schemaResult = addTradeSetupSchema.safeParse(value);
        if (!schemaResult.success) {
          return schemaResult.error.issues[0]?.message || "Validation error";
        }

        // Then validate status-specific business rules
        const selectedStatusOption = statusOptions.find(
          (option) => option.value === value.status
        );
        if (selectedStatusOption?.disabled) {
          const context = {
            isNew: !existingTradeSetup?._id,
            currentStatus: existingSnapshot?.status,
            hasExecutedTrade: previousStatuses.includes("executed"),
            previousStatuses: previousStatuses,
            tradeSetupId: existingTradeSetup?._id,
          };

          if (selectedStatusOption.disabled(context)) {
            return "Selected status is not allowed at this time";
          }
        }

        return undefined;
      },
    },
    defaultValues: {
      title: existingTradeSetup?.title || null,
      status: existingSnapshot?.status || ("idea" as const),
      direction: existingTradeSetup?.direction || ("long" as const),
      riskReward: existingTradeSetup?.riskReward || null,
      timeframes: existingTradeSetup?.timeframes || ["4h"],
      result: existingTradeSetup?.result,
    } as const,

    onSubmit: async ({ value: formData }) => {
      // Check for validation errors and show toast
      const errors = form.state.errors;
      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => {
            if (typeof error === "string") return error;
            if (error && typeof error === "object" && "message" in error)
              return error;
            return String(error);
          })
          .join(", ");
        toast.error(`Validation error: ${errorMessages}`);
        return;
      }

      if (existingTradeSetup) {
        if (attach) {
          return await createSnapshot({
            tradeSetupId: existingTradeSetup._id,
            imageId: imageId as Id<"tradingview_images">,
            status: formData.status,
            result: formData.result,
          });
        }
        return await updateTradeSetup({
          ...formData,
          title: formData.title as string,
          id: existingTradeSetup._id,
          snapshotId: snapshotId as Id<"snapshots">,
        });
      } else {
        if (!smartTitle) throw new Error("A title or smart title is required");

        // Create a new trade setup with the form data
        return await createTradeSetup({
          ...formData,
          title: formData.title || (smartTitle.title as string),
          asset: data?.asset || "Unknown",
          imageId: imageId as Id<"tradingview_images">, // Link to the current image
        });
      }
    },
  });

  // Check if current input is a valid timeframe
  function isValidTimeframe(newTimeframe: string): boolean {
    return newTimeframe.trim()
      ? TIMEFRAMES.includes(newTimeframe.trim() as Timeframe)
      : true;
  }

  // Map to control field disabling when in attach mode
  const fieldDisabledMap = {
    title: attach,
    direction: attach,
    riskReward: attach,
    timeframes: attach,
    status: false,
  };

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
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={
                      fieldDisabledMap.title || isPendingGeneratingSmartTitle
                    }
                    className="text-emerald-500 placeholder:text-emerald-500/60 border-none !bg-transparent !font-mono !text-xs text-end !p-0 w-fit !outline-0 !ring-0 focus-visible:underline !m-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={smartTitle?.title}
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
                          disabled={fieldDisabledMap.direction}
                          className={`px-1 py-0.5 border font-mono text-xs rounded-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
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
                  <StatusOptions
                    selected={field.state.value}
                    onClick={(newStatus) => {
                      field.handleChange(newStatus);
                    }}
                    disabled={fieldDisabledMap.status}
                    context={{
                      isNew: !existingTradeSetup?._id,
                      currentStatus: existingSnapshot?.status, // Use previous snapshot status instead of form value
                      hasExecutedTrade: previousStatuses.includes("executed"),
                      previousStatuses: previousStatuses,
                      tradeSetupId: existingTradeSetup?._id,
                    }}
                  />
                )}
              />
            </div>

            {/* Result Field - Only show when status is "closed" */}
            {/* Conditional Result Field */}
            <form.Subscribe selector={(state) => state.values.status}>
              {(status) =>
                (status === "closed" || existingTradeSetup?.result) && (
                  <form.Field
                    validators={{
                      onChange: resultSchema,
                    }}
                    name="result"
                    defaultValue={existingTradeSetup?.result}
                  >
                    {(field) => (
                      <div className="flex justify-between items-center h-9">
                        <span
                          className={clsx(
                            "text-xs text-muted",
                            field.state.meta.errors.length && "text-red-500"
                          )}
                        >
                          Result
                        </span>
                        <div className="flex flex-row gap-1">
                          {resultOptions.map((option) => {
                            console.log(field.state.value);
                            const isSelected =
                              field.state.value === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                disabled={
                                  existingTradeSetup?.result &&
                                  existingTradeSetup.result !== option.value
                                }
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
                      </div>
                    )}
                  </form.Field>
                )
              }
            </form.Subscribe>
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
                        disabled={fieldDisabledMap.timeframes}
                        className="px-1 py-0.5 border border-muted text-muted-foreground font-mono text-xs rounded-sm transition-all cursor-pointer hover:border-red-400/50 hover:text-red-400/70 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-muted disabled:hover:text-muted-foreground"
                        title="Click to remove"
                      >
                        {timeframe}
                      </button>
                    ))}

                    {/* Add timeframe button/input */}
                    {isAddingTimeframe && !fieldDisabledMap.timeframes ? (
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
                        disabled={fieldDisabledMap.timeframes}
                        className={`w-10 h-6 px-1 py-0.5 border font-mono text-xs rounded-sm bg-transparent !outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                          isValidTimeframe(newTimeframe)
                            ? "border-muted text-muted-foreground"
                            : "border-red-400/70 text-red-400"
                        }`}
                        placeholder="4h"
                      />
                    ) : !fieldDisabledMap.timeframes ? (
                      <button
                        type="button"
                        onClick={() => setIsAddingTimeframe(true)}
                        disabled={fieldDisabledMap.timeframes}
                        className="px-1 py-0.5 border border-muted text-muted-foreground font-mono text-xs rounded-sm transition-all cursor-pointer hover:border-muted-foreground/50 hover:text-muted-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Add timeframe"
                      >
                        +
                      </button>
                    ) : null}
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
                      type="number"
                      step="0.1"
                      min="0"
                      value={field.state.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.handleChange(value === "" ? null : Number(value));
                      }}
                      disabled={fieldDisabledMap.riskReward}
                      className="text-muted-foreground placeholder:text-muted border-none !bg-transparent !font-mono !text-xs text-end !p-0 w-fit !outline-0 !ring-0 focus-visible:underline !m-0 disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      placeholder="3.2"
                    />
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
