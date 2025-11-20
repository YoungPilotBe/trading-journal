import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { statusOptions } from "@/config/constants";
import { Timeframe } from "@/config/timeframe-order";
import { useDialog } from "@/contexts/dialog-context";
import { useGetPreviousStatuses } from "@/hooks/snapshots/use-get-previous-statuses";
import { useRemoveTimeframeFromAllSnapshots } from "@/hooks/snapshots/use-remove-timeframe-from-all-snapshots";
import { useUpdateSnapshot } from "@/hooks/snapshots/use-update-snapshot";
import { useGetTradeSetupTimeframes } from "@/hooks/trade-setup/use-get-trade-setup-timeframes";
import { useUpdateTradeSetup } from "@/hooks/trade-setup/use-update-trade-setup";
import { zodResolver } from "@hookform/resolvers/zod";
import { Doc, Id } from "convex/_generated/dataModel";
import { useEffect } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormState,
} from "react-hook-form";
import { toast } from "sonner";
import NumberField from "../components/number-field";
import TextField from "../components/text-field";
import Direction from "../features/direction";
import Result from "../features/result";
import StatusOptions from "../features/status-options";
import TemplateSelector from "../features/template-selector";
import TimeframesGeneric from "../features/timeframes-generic";
import {
  TradeDetailsSchema,
  tradeDetailsSchema,
  updateSnapshotSchema,
  updateTradeSetupSchema,
} from "../schemas/add-trade-schema";
import { createTradeDetailsDefaultValues } from "../schemas/trade-details-schema";

interface Props {
  tradeSetup: Doc<"trade_setups">;
  snapshot: Doc<"snapshots">;
}

const TradeDetailsForm = ({ tradeSetup, snapshot }: Props) => {
  const { openDialog } = useDialog();

  const { data: previousStatuses = [] } = useGetPreviousStatuses({
    tradeSetupId: tradeSetup._id as Id<"trade_setups">,
  });

  const { data: aggregatedTimeframes = [] } = useGetTradeSetupTimeframes({
    tradeSetupId: tradeSetup._id as Id<"trade_setups">,
  });

  const {
    mutateAsync: updateTradeSetup,
    isPending: isPendingTradeSetupUpdate,
  } = useUpdateTradeSetup({});

  const { mutateAsync: updateSnapshot, isPending: isPendingSnapshotUpdate } =
    useUpdateSnapshot({});

  const {
    mutateAsync: removeTimeframeFromAllSnapshots,
    isPending: isPendingTimeframeRemoval,
  } = useRemoveTimeframeFromAllSnapshots({
    onSuccess: () => {
      toast.success("Timeframe removed from all snapshots");
    },
  });

  const form = useForm<TradeDetailsSchema>({
    resolver: zodResolver(tradeDetailsSchema),
    defaultValues: createTradeDetailsDefaultValues({
      existingTradeSetup: tradeSetup,
      existingSnapshot: snapshot,
      aggregatedTimeframes,
    }),

    mode: "onChange",
  });

  useEffect(() => {
    form.reset(
      createTradeDetailsDefaultValues({
        existingTradeSetup: tradeSetup,
        existingSnapshot: snapshot,
        aggregatedTimeframes,
      })
    );
  }, [form, snapshot, tradeSetup, aggregatedTimeframes]);

  const { control, handleSubmit, setValue, reset, register } = form;
  const { isDirty, isSubmitting } = useFormState({ control });

  const isPending =
    isPendingSnapshotUpdate ||
    isPendingTradeSetupUpdate ||
    isPendingTimeframeRemoval;

  // Handle status change with confirmation if tags exist
  const handleStatusChange = (newStatus: Doc<"snapshots">["status"]) => {
    const originalStatus = snapshot?.status;
    const hasExistingTags =
      snapshot?.tags && Object.keys(snapshot.tags).length > 0;

    // Check if selected status is disabled
    const selectedStatusOption = statusOptions.find(
      (option) => option.value === newStatus
    );

    const context = {
      isNew: !tradeSetup._id,
      currentStatus: snapshot?.status,
      hasExecutedTrade: previousStatuses.includes("executed"),
      previousStatuses: previousStatuses,
      tradeSetupId: tradeSetup._id,
    };

    if (selectedStatusOption?.disabled?.(context)) {
      toast.error(
        "Selected status is not allowed. Keep in mind the chronological order."
      );
      return;
    }

    // If status is changing and there are existing tags, show confirmation
    if (newStatus !== originalStatus && hasExistingTags) {
      openDialog("STATUS_CHANGE_CONFIRMATION", {
        currentStatus: originalStatus || "idea",
        newStatus,
        onRevert: () => {
          setValue("status", originalStatus || "idea", { shouldDirty: false });
        },
        onContinue: () => {
          setValue("status", newStatus, { shouldDirty: true });
        },
      });
    } else {
      setValue("status", newStatus, { shouldDirty: true });
    }
  };

  // Handle timeframe removal with confirmation
  const handleTimeframeRemoval = (
    timeframeToRemove: Timeframe,
    newTimeframes: Timeframe[]
  ) => {
    // Check if this timeframe exists in other snapshots (not just current)
    const snapshotTimeframes = snapshot.timeframes || [];
    const isInCurrentSnapshot = snapshotTimeframes.includes(timeframeToRemove);
    const isInOtherSnapshots =
      aggregatedTimeframes.includes(timeframeToRemove) &&
      aggregatedTimeframes.filter((tf) => tf === timeframeToRemove).length > 1;

    // If timeframe exists in other snapshots, show confirmation dialog
    if (isInOtherSnapshots || !isInCurrentSnapshot) {
      const count = aggregatedTimeframes.filter(
        (tf) => tf === timeframeToRemove
      ).length;

      openDialog("REMOVE_TIMEFRAME_CONFIRMATION", {
        timeframe: timeframeToRemove,
        affectedSnapshotsCount: count,
        onCancel: () => {
          // User cancelled, do nothing
        },
        onConfirm: async () => {
          // Remove from all snapshots
          await removeTimeframeFromAllSnapshots({
            tradeSetupId: tradeSetup._id,
            timeframe: timeframeToRemove,
          });
          setValue("timeframes", newTimeframes, { shouldDirty: true });
        },
      });
    } else {
      // Only in current snapshot, just update normally
      setValue("timeframes", newTimeframes, { shouldDirty: true });
    }
  };

  const onSubmit = async (data: TradeDetailsSchema) => {
    const tradeSetupData = updateTradeSetupSchema.parse({
      ...data,
    });

    const snapshotData = updateSnapshotSchema.parse({
      ...data,
    });
    await updateTradeSetup({ ...tradeSetupData, id: tradeSetup._id });
    await updateSnapshot({ ...snapshotData, snapshotId: snapshot._id });

    reset({ ...tradeSetupData, ...snapshotData });
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col space-y-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* Asset (Read-only) */}
        <TextField
          label="Asset"
          disabled
          className="text-muted-foreground"
          value={tradeSetup.asset}
        />

        {/* Creation Time (Read-only) */}
        <TextField
          label="Created"
          disabled
          className="text-muted-foreground"
          value={tradeSetup.createdAt}
        />

        <Separator className="max-w-[calc(100%-2.5rem)]" />
        {/* Title */}
        <TextField {...register("title")} label="Title" placeholder="Phoenix" />

        {/* Template Select */}
        <Controller
          name="trade_template"
          control={control}
          disabled={isPending}
          render={({ field }) => (
            <TemplateSelector
              field={field}
              label="Template"
              disabled={isPending || isSubmitting}
            />
          )}
        />

        {/* Direction */}
        <Controller
          name="direction"
          disabled={isPending}
          control={control}
          render={({ field }) => <Direction field={field} label="Direction" />}
        />

        {/* Status */}
        <Controller
          name="status"
          disabled={isPending}
          control={control}
          render={({ field }) => (
            <StatusOptions
              field={field}
              label="Status"
              existingTradeSetup={tradeSetup}
              existingSnapshot={snapshot}
              previousStatuses={previousStatuses}
              onStatusChange={handleStatusChange}
            />
          )}
        />

        {/* Result */}
        {(status === "closed" || tradeSetup?.result) && (
          <Controller
            name="result"
            control={control}
            render={({ field }) => (
              <Result
                field={field}
                label="Result"
                existingResult={tradeSetup?.result}
              />
            )}
          />
        )}

        {/* Timeframes */}
        <Controller
          name="timeframes"
          disabled={isPending}
          control={control}
          render={({ field }) => (
            <TimeframesGeneric
              field={field}
              label="Timeframes"
              allTimeframes={aggregatedTimeframes as Timeframe[]}
              highlightedTimeframes={snapshot?.timeframes as Timeframe[]}
              disabled={isPending || isSubmitting}
              onRemove={handleTimeframeRemoval}
            />
          )}
        />
        <NumberField
          {...register("rMultiple", { valueAsNumber: true })}
          label={{
            value: "R-Multiple",
            className: "",
          }}
        />

        {/* Submit Buttons */}
        {isDirty && (
          <div className="absolute bottom-0 translate-y-full right-0 flex flex-row gap-1 mr-[40px]">
            <Button
              type="button"
              className="duration-500 ease-out font-mono tracking-wide leading-3"
              onClick={() => reset()}
            >
              X
            </Button>
            <Button
              type="submit"
              className="duration-500 ease-out font-mono tracking-wide leading-3"
              disabled={isPending || isSubmitting}
            >
              {isPending || isSubmitting ? "Updating..." : "Update"}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
};

export default TradeDetailsForm;
