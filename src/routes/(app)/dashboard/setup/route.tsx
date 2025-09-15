import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { statusOptions } from "@/config/constants";
import { Timeframe, timeframeOrder } from "@/config/timeframe-order";
import { useGetTradeSetup } from "@/hooks/trade-setup/use-get-trade-setup";
import { useUpdateTradeSetup } from "@/hooks/trade-setup/use-update-trade-setup";
import { useGetImage } from "@/hooks/tradingview_images/get_image";
import { addTradeSetupSchema } from "@/schemas/add_trade_setup";
import { useForm, useStore } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { z } from "zod";

const searchSchema = z.object({
  tradeSetupId: z.string(),
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

export const Route = createFileRoute("/(app)/dashboard/setup")({
  validateSearch: searchSchema,
  component: RouteComponent,
  pendingComponent: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-muted-foreground font-mono text-sm">Loading...</div>
    </div>
  ),
});

function RouteComponent() {
  const navigate = useNavigate();
  const { tradeSetupId } = Route.useSearch();
  const { data: tradeSetup, isLoading: isLoadingTradeSetup } = useGetTradeSetup(
    {
      id: tradeSetupId as Id<"trade_setups">,
    }
  );
  const { data: image, isLoading: isLoadingImage } = useGetImage({
    id: tradeSetup?.imageId as Id<"tradingview_images">,
  });
  const { mutateAsync: updateTradeSetup, isPending: isPendingUpdate } =
    useUpdateTradeSetup({
      onSuccess: () => form.reset(),
    });

  const isLoading = isLoadingTradeSetup || isLoadingImage;

  // Initialize form with existing trade setup data
  const form = useForm({
    validators: {
      onChange: addTradeSetupSchema,
    },
    defaultValues: {
      title: tradeSetup?.title || "",
      status: tradeSetup?.status || "idea",
      direction: tradeSetup?.direction || "long",
      riskReward: tradeSetup?.riskReward ?? undefined,
      timeframes: tradeSetup?.timeframes || ["4h"],
    },

    onSubmit: async ({ value: formData }) => {
      if (tradeSetup) {
        await updateTradeSetup({ ...formData, id: tradeSetup._id });
      }
    },
  });

  // Subscribe to form's dirty state to trigger re-renders
  const isDirty = useStore(form.store, (state) => state.isDirty);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground font-mono text-sm">
          Loading...
        </div>
      </div>
    );
  }

  if (!tradeSetup) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground font-mono text-sm">
          Trade setup not found
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-8 min-h-screen p-6">
      {/* Left side - General Information (Fixed width) */}
      <div className="flex-shrink-0 w-fit min-w-110 @container">
        <div className="relative space-y-6">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button
                      onClick={() => navigate({ to: "/dashboard" })}
                      className="hover:text-foreground transition-colors"
                    >
                      Trade Setups
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {tradeSetup?.title || "Trade Setup"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Asset Info */}
          <div className="space-y-4 border-b pb-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-mono text-sm">
                Asset
              </span>
              <span className="text-foreground font-mono text-sm">
                {tradeSetup.asset}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-mono text-sm">
                Creation Time
              </span>
              <span className="text-foreground font-mono text-sm">
                {format(new Date(tradeSetup._creationTime), "MMM dd, HH:mm")}
              </span>
            </div>
          </div>

          {/* Form */}
          <form
            aria-disabled={isLoading}
            className="font-mono"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <fieldset
              disabled={isLoading || isPendingUpdate}
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
                          className="px-1 py-0.5 border border-muted text-muted-foreground font-mono text-xs rounded-sm transition-all cursor-pointer hover:border-foreground/50 hover:text-foreground"
                        >
                          {timeframe}
                        </button>
                      ))}
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

              {isDirty && (
                <Button
                  type="submit"
                  className="absolute bottom-0 translate-y-full right-0 duration-500 ease-out font-mono tracking-wide leading-3"
                  disabled={isPendingUpdate || form.state.isSubmitting}
                >
                  {isPendingUpdate || form.state.isSubmitting
                    ? "Updating..."
                    : "Update"}
                </Button>
              )}
            </fieldset>
          </form>
        </div>
      </div>

      {/* Right side - Image (Flexible width) */}
      <div className="flex-1 min-w-0">
        {image?.url ? (
          <div className="w-full @[110px]:h-full rounded-lg overflow-hidden">
            <img
              src={image.url}
              alt="Trading setup chart"
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-full rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground font-mono text-sm">
              No image available
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
