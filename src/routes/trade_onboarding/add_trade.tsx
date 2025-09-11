import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Timeframe, timeframeOrder } from "@/config/timeframe-order";
import { useCreateTradeSetup } from "@/hooks/trade-setup/use-create-trade-setup";
import { useGetTradeSetupByImageId } from "@/hooks/trade-setup/use-get-trade-setup-by-image-id";
import { useUpdateTradeSetup } from "@/hooks/trade-setup/use-update-trade-setup";
import { useGetImage } from "@/hooks/tradingview_images/get_image";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const searchSchema = z.object({
  imageId: z.string(),
});

// Form schema for the trade
const formSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  status: z.enum(["idea", "watching", "executed", "closed", "reviewed"]),
  direction: z.enum(["long", "short"]),
  riskReward: z
    .string()
    .optional()
    .refine((value) => {
      if (!value || value.trim() === "") return true; // Optional field
      const regex = /^\d{1,2}(\.\d)?:\d{1,2}(\.\d)?$/;
      return regex.test(value.trim());
    }, "Risk/reward must be in format like '5:3' or '3.1:2' (max 1 decimal place)"),
  timeframes: z.array(
    z
      .string()
      .refine(
        (tf) => timeframeOrder.includes(tf as Timeframe),
        "Invalid timeframe. Must be one of: 1m, 2m, 3m, 5m, 6m, 10m, 12m, 15m, 20m, 24m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 18h, D, 2D, 3D, 4D, 5D, 6D, W, 2W, M"
      )
  ),
});

type FormData = z.infer<typeof formSchema>;

const statusOptions = [
  {
    value: "idea",
    label: "Idea",
    color: "border-blue-400/70 bg-blue-500/5 text-blue-300/80",
  },
  {
    value: "watching",
    label: "Watching",
    color: "border-yellow-400/70 bg-yellow-500/5 text-yellow-300/80",
  },
  {
    value: "executed",
    label: "Executed",
    color: "border-green-400/70 bg-green-500/5 text-green-300/80",
  },
  {
    value: "closed",
    label: "Closed",
    color: "border-purple-400/70 bg-purple-500/5 text-purple-300/80",
  },
  {
    value: "reviewed",
    label: "Reviewed",
    color: "border-orange-400/70 bg-orange-500/5 text-orange-300/80",
  },
] as const;

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
});

function RouteComponent() {
  const { imageId } = Route.useSearch();
  const { data, isLoading: isLoadingImage } = useGetImage({ id: imageId });
  const { data: existingTradeSetup, isLoading: isLoadingTradeSetup } =
    useGetTradeSetupByImageId({
      imageId: imageId as Id<"tradingview_images">,
    });
  const { mutateAsync: createTradeSetup, isPending: isPendingSubmit } =
    useCreateTradeSetup();
  const { mutateAsync: updateTradeSetup, isPending: isPendingUpdate } =
    useUpdateTradeSetup();

  const isLoading =
    isLoadingImage || isLoadingTradeSetup || isPendingSubmit || isPendingUpdate;

  const navigate = useNavigate();

  // Initialize form with react-hook-form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "Phoenix",
      status: "idea",
      direction: "long",
      riskReward: "",
      timeframes: ["4h"],
    },
  });

  // Update form values when existing trade setup is loaded
  useEffect(() => {
    if (existingTradeSetup) {
      form.reset({
        title: existingTradeSetup.title,
        status: existingTradeSetup.status,
        direction: existingTradeSetup.direction,
        riskReward: existingTradeSetup.riskReward,
        timeframes: existingTradeSetup.timeframes,
      });
    }
  }, [existingTradeSetup, form]);

  // State for managing the add timeframe input
  const [isAddingTimeframe, setIsAddingTimeframe] = useState(false);
  const [newTimeframe, setNewTimeframe] = useState("");

  // Check if current input is a valid timeframe
  const isValidTimeframe = newTimeframe.trim()
    ? timeframeOrder.includes(newTimeframe.trim() as Timeframe)
    : true;

  const onSubmit = async (reactFormData: FormData) => {
    let tradeSetupId: string;

    if (existingTradeSetup) {
      await updateTradeSetup({
        id: existingTradeSetup._id,
        title: reactFormData.title,
        direction: reactFormData.direction,
        status: reactFormData.status,
        riskReward: reactFormData.riskReward,
        timeframes: reactFormData.timeframes,
      });
      tradeSetupId = existingTradeSetup._id;
    } else {
      // Create a new trade setup with the form data
      tradeSetupId = await createTradeSetup({
        title: reactFormData.title,
        asset: data?.asset || "Unknown",
        direction: reactFormData.direction,
        status: reactFormData.status,
        riskReward: reactFormData.riskReward,
        timeframes: reactFormData.timeframes,
        imageId: imageId as Id<"tradingview_images">, // Link to the current image
      });
    }

    // Navigate to the tags page with the trade setup ID
    navigate({
      to: "/trade_onboarding/add_tags",
      search: {
        tradeSetupId: tradeSetupId as string,
        imageId: imageId,
      },
    });
  };

  // Timeframe handlers
  const handleAddTimeframe = () => {
    const trimmedTimeframe = newTimeframe.trim();
    if (
      trimmedTimeframe &&
      timeframeOrder.includes(trimmedTimeframe as Timeframe) &&
      !form.getValues("timeframes").includes(trimmedTimeframe)
    ) {
      const currentTimeframes = form.getValues("timeframes");
      const newTimeframes = sortTimeframes([
        ...currentTimeframes,
        trimmedTimeframe,
      ]);
      form.setValue("timeframes", newTimeframes);
    }
    // Always clear and close regardless of whether we added or not
    setNewTimeframe("");
    setIsAddingTimeframe(false);
  };

  const handleRemoveTimeframe = (timeframeToRemove: string) => {
    const currentTimeframes = form.getValues("timeframes");
    form.setValue(
      "timeframes",
      currentTimeframes.filter((tf) => tf !== timeframeToRemove)
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTimeframe();
    } else if (e.key === "Escape") {
      setNewTimeframe("");
      setIsAddingTimeframe(false);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Right-side form panel - opposite to the centered AnimatedImageLayout */}
      <div className="absolute left-[60%] right-[10%] top-[20%] bottom-[40%] h-auto max-h-[70vh] max-w-[25vw] pointer-events-auto">
        <div className="w-full flex flex-col border-b-[1px] -space-y-1 py-2 font-mono text-xs">
          {/* Title Input */}

          {/* Asset (read-only) */}
          <div className="flex justify-between items-center h-9">
            <span className="text-muted font-light">Asset</span>
            <span className="text-muted-foreground">{data?.asset}</span>
          </div>

          {/* Timeframe */}
          <div className="flex justify-between items-center h-9">
            <span className="text-muted font-light">Timeframe</span>
            <span className="text-muted-foreground">4H (placeholder)</span>
          </div>

          {/* Current Time */}
          <div className="flex justify-between items-center h-9">
            <span className="text-muted font-light">Creation Time</span>
            <span className="text-muted-foreground">
              {data?._creationTime &&
                format(new Date(data._creationTime), "HH:mm")}
            </span>
          </div>
        </div>
        <form className="w-full flex flex-col -space-y-1 py-2 font-mono text-xs">
          <div className="flex justify-between items-center h-9">
            <span className="text-muted font-light">Title</span>
            <Input
              {...form.register("title")}
              className="text-emerald-500 placeholder:text-emerald-500/60 border-none !bg-transparent !font-mono !text-xs text-end !p-0 w-fit !outline-0 !ring-0 focus-visible:underline !m-0"
              placeholder="Phoenix"
            />
          </div>
          {form.formState.errors.title && (
            <span className="text-red-400 text-[10px]">
              {form.formState.errors.title.message}
            </span>
          )}

          {/* Direction Buttons */}
          <div className="flex justify-between items-center h-9">
            <span className="text-muted font-light">Direction</span>
            <div className="flex flex-row gap-1">
              {directionOptions.map((option) => {
                const isSelected = form.watch("direction") === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => form.setValue("direction", option.value)}
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

          {/* Status Badges */}
          <div className="flex justify-between items-center h-9">
            <span className="text-muted font-light">Status</span>
            <div className="flex flex-row gap-1.5">
              {statusOptions.map((option) => {
                const isSelected = form.watch("status") === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => form.setValue("status", option.value)}
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
          {/* Timeframes */}
          <div className="flex justify-between items-center h-9">
            <span className="text-muted font-light">Timeframes</span>
            <div className="flex flex-row gap-1">
              {sortTimeframes(form.watch("timeframes")).map((timeframe) => (
                <button
                  key={timeframe}
                  type="button"
                  onClick={() => handleRemoveTimeframe(timeframe)}
                  className="px-1 py-0.5 border border-muted text-muted-foreground font-mono text-xs rounded-sm transition-all cursor-pointer hover:border-red-400/50 hover:text-red-400/70"
                  title="Click to remove"
                >
                  {timeframe}
                </button>
              ))}

              {/* Add timeframe button/input */}
              {isAddingTimeframe ? (
                <Input
                  value={newTimeframe}
                  onChange={(e) => setNewTimeframe(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={handleAddTimeframe}
                  autoFocus
                  className={`w-10 h-6 px-1 py-0.5 border font-mono text-xs rounded-sm bg-transparent !outline-none ${
                    isValidTimeframe
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
          </div>
          {/* Risk/Reward Input */}
          <div className="flex justify-between items-center h-9">
            <span className="text-muted font-light">Risk / Reward</span>
            <Input
              {...form.register("riskReward")}
              className="text-muted-foreground placeholder:text-muted border-none !bg-transparent !font-mono !text-xs text-end !p-0 w-fit !outline-0 !ring-0 focus-visible:underline !m-0"
              placeholder="3:2"
            />
          </div>
          {form.formState.errors.riskReward && (
            <div className="flex justify-end">
              <span className="text-red-400 text-xs">
                {form.formState.errors.riskReward.message}
              </span>
            </div>
          )}
        </form>
        <Button
          className="absolute bottom-0 right-0 duration-500 ease-out font-mono tracking-wide leading-3"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading}
        >
          {isLoading
            ? existingTradeSetup
              ? "Updating..."
              : "Creating..."
            : "Proceed"}
        </Button>
      </div>
    </div>
  );
}
