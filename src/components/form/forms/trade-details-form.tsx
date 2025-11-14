import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { statusOptions } from "@/config/constants";
import { Timeframe } from "@/config/timeframe-order";
import { useDialog } from "@/contexts/dialog-context";
import { useGetPreviousStatuses } from "@/hooks/snapshots/use-get-previous-statuses";
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

  const {
    mutateAsync: updateTradeSetup,
    isPending: isPendingTradeSetupUpdate,
  } = useUpdateTradeSetup({});

  const { mutateAsync: updateSnapshot, isPending: isPendingSnapshotUpdate } =
    useUpdateSnapshot({});

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
              singleTimeframe={snapshot?.timeframe as Timeframe}
              disabled={isPending || isSubmitting}
            />
          )}
        />
        <NumberField
          {...register("riskReward", { valueAsNumber: true })}
          label={{
            value: ["closed", "reviewed"].includes(
              form.getValues("status") || ""
            )
              ? "RR Multiple"
              : "Risk Reward",
            className: ["closed", "reviewed"].includes(
              form.getValues("status") || ""
            )
              ? "text-pink-500"
              : "",
          }}
          className={
            ["closed", "reviewed"].includes(form.getValues("status") || "")
              ? "text-pink-500"
              : undefined
          }
          disabled={["closed", "reviewed"].includes(
            form.getValues("status") || ""
          )}

          // We need to pink the text
          // the risk reward field will be disabled when status is closed / reviewed
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
