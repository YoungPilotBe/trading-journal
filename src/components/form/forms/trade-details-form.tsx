import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { statusOptions } from "@/config/constants";
import { Timeframe } from "@/config/timeframe-order";
import { useDialog } from "@/contexts/dialog-context";
import { useUpdateSnapshot } from "@/hooks/snapshots/use-update-snapshot";
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
import NotesSelector from "../features/notes-selector";
import Result from "../features/result";
import StatusOptions from "../features/status-options";
import TemplateSelector from "../features/template-selector";
import TimeframesGeneric from "../features/timeframes-generic";
import {
  createTradeDetailsDefaultValues,
  TradeDetailsSchema,
  tradeDetailsSchema,
} from "../schemas/trade-details-schema";

interface Props {
  tradeSetupId: Id<"trade_setups">;
  snapshotId: Id<"snapshots">;
  tradeSetup?: Doc<"trade_setups"> | null;
  snapshot?: Doc<"snapshots"> | null;
  previousStatuses?: Doc<"snapshots">["status"][];
  onSuccess?: () => void;
}

const TradeDetailsForm = ({
  tradeSetupId,
  snapshotId,
  tradeSetup,
  snapshot,
  previousStatuses = [],
  onSuccess,
}: Props) => {
  const { openDialog } = useDialog();

  const {
    mutateAsync: updateTradeSetup,
    isPending: isPendingTradeSetupUpdate,
  } = useUpdateTradeSetup({
    onSuccess: () => {
      onSuccess?.();
      toast.success("Trade setup updated");
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const { mutateAsync: updateSnapshot, isPending: isPendingSnapshotUpdate } =
    useUpdateSnapshot({
      onSuccess: () => {
        onSuccess?.();
      },
      onError: () => {
        toast.error("Something went wrong");
      },
    });

  const form = useForm<TradeDetailsSchema>({
    resolver: zodResolver(tradeDetailsSchema),
    defaultValues: createTradeDetailsDefaultValues({
      existingTradeSetup: tradeSetup,
      existingSnapshot: snapshot,
    }),
    mode: "onChange",
  });

  useEffect(() => {
    form.reset(
      createTradeDetailsDefaultValues({
        existingTradeSetup: tradeSetup,
        existingSnapshot: snapshot,
      })
    );
  }, [form, snapshot, tradeSetup]);

  const { control, handleSubmit, setValue, reset, register } = form;
  const { isDirty, isSubmitting } = useFormState({ control });

  const isPending = isPendingSnapshotUpdate || isPendingTradeSetupUpdate;

  // Track original status
  const originalStatus = snapshot?.status;
  const hasExistingTags =
    snapshot?.tags && Object.keys(snapshot.tags).length > 0;

  // Handle status change with confirmation if tags exist
  const handleStatusChange = (newStatus: Doc<"snapshots">["status"]) => {
    // Check if selected status is disabled
    const selectedStatusOption = statusOptions.find(
      (option) => option.value === newStatus
    );

    const context = {
      isNew: !tradeSetupId,
      currentStatus: snapshot?.status,
      hasExecutedTrade: previousStatuses.includes("executed"),
      previousStatuses: previousStatuses,
      tradeSetupId: tradeSetupId,
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

  const onSubmit = async (formData: TradeDetailsSchema) => {
    if (!tradeSetup || !snapshot) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status, asset, creationTime, result, notes, ...tradeSetupData } =
      formData;

    await Promise.all([
      updateTradeSetup({
        ...tradeSetupData,
        result: result || undefined, // Convert null to undefined
        id: tradeSetup._id,
        snapshotId: snapshot._id,
      }),
      updateSnapshot({
        status,
        snapshotId: snapshotId,
      }),
    ]);

    reset(formData);
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col space-y-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* Asset (Read-only) */}
        <TextField
          {...register("asset")}
          label="Asset"
          disabled
          className="text-muted-foreground"
        />

        {/* Creation Time (Read-only) */}
        <TextField
          {...register("creationTime")}
          label="Created"
          disabled
          className="text-muted-foreground"
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

        {/* Notes Selector */}
        <Controller
          name="notes"
          control={control}
          disabled={isPending}
          render={({ field }) => (
            <NotesSelector
              field={field}
              label="Notes"
              disabled={isPending || isSubmitting}
              snapshotId={snapshotId}
              tradeSetupId={tradeSetupId}
              snapshot={snapshot}
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
              singleTimeframe={snapshot?.timeframe as Timeframe}
              disabled={isPending || isSubmitting}
            />
          )}
        />

        {/* Risk/Reward */}
        <NumberField
          {...register("riskReward", { valueAsNumber: true })}
          label="Risk / Reward"
          placeholder="3.2"
          step="0.1"
          min="0"
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
