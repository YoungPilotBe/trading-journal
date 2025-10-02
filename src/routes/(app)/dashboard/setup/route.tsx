import ResultBadge from "@/components/result-badge";
import SimilarTradesTable from "@/components/similar-trades-table";
import SnapshotHistory from "@/components/snapshot-history";
import { SnapshotImage } from "@/components/snapshot-image";
import StatusOptions from "@/components/status-options";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { statusOptions } from "@/config/constants";
import { Timeframe, TIMEFRAMES } from "@/config/timeframe-order";
import { useDialog } from "@/contexts/dialog-context";
import { useGetPreviousStatuses } from "@/hooks/snapshots/use-get-previous-statuses";
import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { useUpdateSnapshot } from "@/hooks/snapshots/use-update-snapshot";
import { useGetTradeSetup } from "@/hooks/trade-setup/use-get-trade-setup";
import { useUpdateTradeSetup } from "@/hooks/trade-setup/use-update-trade-setup";
import { useGetTradeTemplates } from "@/hooks/trade_templates/use-get-trade-templates";
import { preloadSetupRouteData } from "@/lib/preloadRoutes";
import { addTradeSetupSchema } from "@/schemas/add_trade_setup";
import { useForm, useStore } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Doc, Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import {
  Archive,
  ChevronRightIcon,
  MoreVertical,
  PlusIcon,
  Tags,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
  tradeSetupId: z.string(),
  snapshotId: z.string(),
  image: z.optional(z.enum(["preview"])),
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
    const indexA = TIMEFRAMES.indexOf(a as Timeframe);
    const indexB = TIMEFRAMES.indexOf(b as Timeframe);
    return indexA - indexB;
  });
};

export const Route = createFileRoute("/(app)/dashboard/setup")({
  validateSearch: searchSchema,
  component: RouteComponent,
  preload: true,
  loaderDeps: ({ search: { tradeSetupId, snapshotId } }) => ({
    tradeSetupId,
    snapshotId,
  }),
  loader: async ({
    deps: { tradeSetupId, snapshotId },
    context: { queryClient },
  }) => {
    await preloadSetupRouteData(queryClient, tradeSetupId, snapshotId);
    return { tradeSetupId, snapshotId };
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const { tradeSetupId, snapshotId, image } = Route.useSearch();

  const { openDialog } = useDialog();

  const { data: tradeSetup, isLoading: isLoadingTradeSetup } = useGetTradeSetup(
    {
      id: tradeSetupId as Id<"trade_setups">,
    }
  );

  const { data: snapshot, isLoading: isLoadingSnapshot } = useGetSnapshot({
    id: snapshotId as Id<"snapshots">,
  });

  const { data: templates, isLoading: isLoadingTemplates } =
    useGetTradeTemplates({});

  // Get previous statuses for chronological validation
  const { data: previousStatuses = [] } = useGetPreviousStatuses({
    tradeSetupId: tradeSetupId as Id<"trade_setups">,
  });

  const {
    mutateAsync: updateTradeSetup,
    isPending: isPendingTradeSetupUpdate,
  } = useUpdateTradeSetup({
    // onSuccess: () => form.reset(),
  });

  const { mutateAsync: updateSnapshot, isPending: isPendingSnapshotUpdate } =
    useUpdateSnapshot({
      // onSuccess: () => form.reset(),
    });

  const isLoading = isLoadingTradeSetup || isLoadingSnapshot;

  // Track original status to detect changes and check for existing tags
  const originalStatus = snapshot?.status;
  const hasExistingTags =
    snapshot?.tags && Object.keys(snapshot.tags).length > 0;

  // Initialize form with existing trade setup data
  const form = useForm({
    validators: {
      onChange: addTradeSetupSchema,
      onSubmit: ({ value }) => {
        // Check if selected status is disabled
        const selectedStatusOption = statusOptions.find(
          (option) => option.value === value.status
        );
        if (selectedStatusOption?.disabled) {
          const context = {
            isNew: !tradeSetupId,
            currentStatus: snapshot?.status,
            hasExecutedTrade: previousStatuses.includes("executed"),
            previousStatuses: previousStatuses,
            tradeSetupId: tradeSetupId as Id<"trade_setups">,
          };

          if (selectedStatusOption.disabled(context)) {
            toast.error(
              "Selected status is not allowed keep in mind the chronological order"
            );
            return "Selected status is not allowed keep in mind the chronological order";
          }
        }
        return undefined;
      },
    },
    defaultValues: {
      title: tradeSetup?.title || null,
      trade_template: tradeSetup?.trade_template || undefined,
      status: snapshot?.status || "idea",
      direction: tradeSetup?.direction || "long",
      riskReward: tradeSetup?.riskReward || null,
      timeframes: tradeSetup?.timeframes || ["4h"],
    },

    onSubmit: async ({ value: formData }) => {
      if (tradeSetup && snapshot) {
        const { status, ...tradeSetupData } = formData;

        try {
          await Promise.all([
            updateTradeSetup({
              ...tradeSetupData,
              id: tradeSetup._id,
              snapshotId: snapshot._id,
            }),
            updateSnapshot({
              status,
              snapshotId: snapshotId as Id<"snapshots">,
            }),
          ]);

          // Reset form on successful submission
          form.reset();
        } catch (error) {
          console.error("Failed to update:", error);
        }
      }
    },
  });

  const isPending = isPendingSnapshotUpdate || isPendingTradeSetupUpdate;

  // Subscribe to form's dirty state to trigger re-renders
  const isDirty = useStore(form.store, (state) => state.isDirty);

  // Handle status change with confirmation if tags exist
  const handleStatusChange = (newStatus: Doc<"snapshots">["status"]) => {
    // If status is changing and there are existing tags, show confirmation
    if (newStatus !== originalStatus && hasExistingTags) {
      openDialog("STATUS_CHANGE_CONFIRMATION", {
        currentStatus: originalStatus || "idea",
        newStatus,
        onRevert: () => {
          // Reset status to original value - force re-render by updating field
          form.setFieldValue("status", originalStatus || "idea");
        },
        onContinue: () => {
          // Proceed with status change
          form.setFieldValue("status", newStatus);
        },
      });
    } else {
      // No tags or no status change, proceed normally
      form.setFieldValue("status", newStatus);
    }
  };

  return (
    <>
      <div className="flex gap-8 p-6 h-[400px]">
        {/* Left side - General Information (Fixed width) */}
        <div className="flex-shrink-0 w-fit min-w-150 @container">
          <div className="relative space-y-6">
            {/* Breadcrumbs */}
            <div className="mb-6 flex items-center justify-between">
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
                    <BreadcrumbPage className="flex items-center gap-2">
                      {tradeSetup?.title || "Trade Setup"}
                      <ResultBadge result={tradeSetup?.result} />
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 translate-x-4"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="justify-between"
                    onClick={() =>
                      navigate({
                        to: "/trade_onboarding/add_tags",
                        search: {
                          tradeSetupId,
                          imageId: snapshot?.imageId || "",
                          snapshotId,
                        },
                      })
                    }
                  >
                    <Tags />
                    View Tags
                  </DropdownMenuItem>
                  <DropdownMenuItem className="justify-between">
                    <Archive />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive justify-between"
                    onClick={() =>
                      openDialog("DELETE_TRADE_SETUP", {
                        tradeSetupId: tradeSetupId as Id<"trade_setups">,
                        tradeSetupTitle: tradeSetup?.title || "",
                      })
                    }
                  >
                    <Trash2Icon className="text-inherit" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Asset Info */}
            <div className="space-y-4 border-b pb-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-mono text-sm">
                  Asset
                </span>
                <span className="text-foreground font-mono text-sm">
                  {tradeSetup?.asset}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-mono text-sm">
                  Creation Time
                </span>
                <span className="text-foreground font-mono text-sm">
                  {tradeSetup?._creationTime &&
                    format(new Date(tradeSetup._creationTime), "MMM dd, HH:mm")}
                </span>
              </div>

              {tradeSetup?.result && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-mono text-sm">
                    Result
                  </span>
                  <ResultBadge result={tradeSetup.result} />
                </div>
              )}
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
                disabled={isLoading || isPending}
                className="disabled:opacity-50 disabled:!cursor-default disabled:!pointer-events-none"
              >
                <form.Field
                  name="title"
                  children={(field) => (
                    <div className="flex justify-between items-center h-9">
                      <label
                        className="text-xs text-muted"
                        htmlFor={field.name}
                      >
                        Title
                      </label>
                      <input
                        id={field.name}
                        name={field.name}
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="text-emerald-500 placeholder:text-emerald-500/60 border-none !bg-transparent !font-mono !text-xs text-end !p-0 w-fit !outline-0 !ring-0 focus-visible:underline !m-0"
                        placeholder="Phoenix"
                      />
                    </div>
                  )}
                />

                {/* Template Select */}
                <form.Field
                  name="trade_template"
                  children={(field) => (
                    <div className="flex justify-between items-center h-9">
                      <label
                        className="text-xs text-muted"
                        htmlFor={field.name}
                      >
                        Template
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          {field.state.value ? (
                            <Button
                              variant="outline"
                              size="badge"
                              className="text-[10px] justify-between hover:bg-accent hover:text-accent-foreground group-hover:[&:not(:has(.chevron-link:hover))]:bg-accent group-hover:[&:not(:has(.chevron-link:hover))]:text-accent-foreground group-[.chevron-hovered]:bg-transparent group-[.chevron-hovered]:text-inherit transition-colors gap-1"
                            >
                              {
                                templates?.find(
                                  (t) => t._id === field.state.value
                                )?.title
                              }
                              <Link
                                to={"/dashboard/trade_templates/trade_template"}
                                search={{ templateId: field.state.value }}
                                className="chevron-link rounded hover:bg-accent/50 hover:text-white text-white/50 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                                onMouseEnter={(e) => {
                                  e.currentTarget
                                    .closest(".group")
                                    ?.classList.add("chevron-hovered");
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget
                                    .closest(".group")
                                    ?.classList.remove("chevron-hovered");
                                }}
                              >
                                <ChevronRightIcon className="size-4 text-inherit" />
                              </Link>
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="badge"
                              className="text-[10px] mb-2"
                              disabled={isLoadingTemplates}
                            >
                              <PlusIcon className="size-2" />
                              Add Template
                            </Button>
                          )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          sideOffset={0}
                          alignOffset={0}
                          className="w-60"
                        >
                          {templates?.map((template) => (
                            <DropdownMenuItem
                              key={template._id}
                              onClick={() => field.handleChange(template._id)}
                              className="justify-between"
                            >
                              <span>{template.title}</span>
                              {field.state.value === template._id ? (
                                <button
                                  className="p-1 rounded hover:bg-accent/50 hover:text-white text-white/50 transition-colors"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    field.handleChange(undefined);
                                    form.setFieldValue(
                                      "trade_template",
                                      undefined
                                    );
                                  }}
                                >
                                  <XIcon className="size-4 text-inherit" />
                                </button>
                              ) : (
                                <Link
                                  to={
                                    "/dashboard/trade_templates/trade_template"
                                  }
                                  search={{ templateId: template._id }}
                                  className="p-1 rounded hover:bg-accent/50 hover:text-white text-white/50 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ChevronRightIcon className="size-4 text-inherit" />
                                </Link>
                              )}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator hidden={!templates?.length} />
                          <DropdownMenuItem
                            className="justify-between text-emerald-500"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate({
                                to: "/dashboard/trade_templates/trade_template",
                              });
                            }}
                          >
                            <span>Create Template</span>
                            <PlusIcon className="size-4 text-inherit" />
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                      <StatusOptions
                        selected={field.state.value}
                        originalStatus={snapshot?.status} // Optional: pass this to enable change tracking
                        onClick={handleStatusChange}
                        disabled={isLoading}
                        context={{
                          isNew: !tradeSetupId,
                          currentStatus: snapshot?.status, // Use current snapshot status for chronological validation
                          hasExecutedTrade:
                            previousStatuses.includes("executed"),
                          previousStatuses: previousStatuses,
                          tradeSetupId: tradeSetupId as Id<"trade_setups">,
                        }}
                      />
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
                          type="number"
                          step="0.1"
                          min="0"
                          value={field.state.value ?? ""}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          className="text-muted-foreground placeholder:text-muted border-none !bg-transparent !font-mono !text-xs text-end !p-0 w-fit !outline-0 !ring-0 focus-visible:underline !m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          placeholder="3.2"
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
                  <div className="absolute bottom-0 translate-y-full right-0 flex flex-row gap-1">
                    <Button
                      className="duration-500 ease-out font-mono tracking-wide leading-3"
                      onClick={() => form.reset()}
                    >
                      X
                    </Button>
                    <Button
                      type="submit"
                      className="duration-500 ease-out font-mono tracking-wide leading-3"
                      disabled={isPending || form.state.isSubmitting}
                    >
                      {isPending || form.state.isSubmitting
                        ? "Updating..."
                        : "Update"}
                    </Button>
                  </div>
                )}
              </fieldset>
            </form>
          </div>
        </div>

        {/* Right side - Image (Flexible width) */}
        <div className="flex-1 min-w-0 h-full">
          <SnapshotImage
            snapshotId={snapshotId}
            tradeSetupId={tradeSetupId}
            initialFullscreen={image === "preview" || false}
            className="h-full"
          />
          <SnapshotHistory
            snapshotId={snapshotId as Id<"snapshots">}
            tradeSetupId={tradeSetupId as Id<"trade_setups">}
          />
        </div>
      </div>
      <SimilarTradesTable
        tradeSetupId={tradeSetupId as Id<"trade_setups">}
        snapshotId={snapshotId as Id<"snapshots">}
        limit={4}
        currentStatus={snapshot?.status}
      />
    </>
  );
}
