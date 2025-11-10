/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { statusOptions } from "@/config/constants";
import { useDialog } from "@/contexts/dialog-context";
import { useGetPreviousStatuses } from "@/hooks/snapshots/use-get-previous-statuses";
import { useUpdateSnapshot } from "@/hooks/snapshots/use-update-snapshot";
import { useUpdateTradeSetup } from "@/hooks/trade-setup/use-update-trade-setup";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Doc, Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { useEffect } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormState,
} from "react-hook-form";
import { toast } from "sonner";
import NumberField from "../components/number-field";
import SubmitButton from "../components/submit-button";
import TextField from "../components/text-field";
import Direction from "../features/direction";
import EmotionOptions from "../features/emotion-selector";
import Result from "../features/result";
import SingleTimeframe from "../features/single-timeframe";
import StatusOptions from "../features/status-options";
import TemplateSelector from "../features/template-selector";
import Timeframes from "../features/timeframes";
import {
  TradeDetailsSchema,
  tradeDetailsSchema,
  updateSnapshotSchema,
  updateTradeSetupSchema,
} from "../schemas/add-trade-schema";
import { createTradeDetailsDefaultValues } from "../schemas/trade-details-schema";
import { addTimeframeToTimeframes } from "../utils";

interface Props {
  tradeSetup: Doc<"trade_setups">;
  snapshot: Doc<"snapshots">;
  imageId: Id<"tradingview_images">;
}

const UpdateTradeForm = ({ tradeSetup, snapshot, imageId }: Props) => {
  const navigate = useNavigate();
  const search = useSearch({ from: "/trade_onboarding/update_trade" });
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

  const { register, control, handleSubmit, setValue, reset, watch } = form;
  const { isDirty, isSubmitting } = useFormState({ control });

  const isPending = isPendingSnapshotUpdate || isPendingTradeSetupUpdate;

  // Watch status to conditionally render result field
  const status = watch("status");

  // Watch timeframe field and automatically add to timeframes array
  const timeframe = watch("timeframe");

  form.subscribe({
    name: "timeframe",
    callback({ values }) {
      // Only update if there's a timeframe value and it's not empty
      if (values.timeframe && values.timeframe.trim() !== "") {
        form.setValue(
          "timeframes",
          addTimeframeToTimeframes(values.timeframes, values.timeframe)
        );
      }
    },
  });

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
      isNew: false,
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

  function handleNavigate(args: {
    tradeSetupId: Id<"trade_setups">;
    imageId: Id<"tradingview_images">;
    snapshotId: Id<"snapshots">;
  }) {
    const newSearch = { ...search, ...args };
    navigate({
      from: "/trade_onboarding/update_trade",
      search: newSearch,
      replace: true,
    });
    navigate({
      to: "/trade_onboarding/add_template",
      search: newSearch,
    });
  }

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

    // Navigate to next step
    handleNavigate({
      imageId,
      snapshotId: snapshot._id,
      tradeSetupId: tradeSetup._id,
    });
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col space-y-3 px-4 py-3"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* Display read-only info */}
        <TextField
          label="Asset"
          value={tradeSetup.asset}
          disabled
          className="text-muted-foreground"
        />
        <Controller
          name="timeframe"
          control={control}
          render={({ field }) => (
            <SingleTimeframe
              field={
                field as unknown as Parameters<
                  typeof SingleTimeframe
                >[0]["field"]
              }
              label="Timeframe"
            />
          )}
        />
        <TextField
          label="Creation Time"
          value={
            tradeSetup._creationTime &&
            format(new Date(tradeSetup._creationTime), "HH:mm")
          }
          disabled
          className="text-muted-foreground"
        />

        <Separator />

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

        <Controller
          name="direction"
          control={control}
          render={({ field }) => (
            <Direction disabled={isPending} field={field} label="Direction" />
          )}
        />

        <Controller
          name="status"
          control={control}
          disabled={isPending}
          render={({ field }) => (
            <StatusOptions
              field={field}
              label="Status"
              previousStatuses={previousStatuses}
              existingSnapshot={snapshot}
              existingTradeSetup={tradeSetup}
              onStatusChange={handleStatusChange}
            />
          )}
        />

        {/* Only render result field when status is "closed" or there's an existing result */}
        {(status === "closed" || tradeSetup?.result) && (
          <Controller
            name="result"
            control={control}
            render={({ field }) => (
              <Result
                field={field}
                label="Result"
                disabled={!!tradeSetup?.result}
                existingResult={tradeSetup?.result}
              />
            )}
          />
        )}

        <Controller
          name="emotion"
          control={control}
          disabled={isPending}
          render={({ field }) => (
            <EmotionOptions field={field} label="Emotion" />
          )}
        />

        <Controller
          name="timeframes"
          control={control}
          render={({ field }) => (
            <Timeframes
              field={
                field as unknown as Parameters<typeof Timeframes>[0]["field"]
              }
              label="Timeframes"
              singleTimeframe={timeframe}
            />
          )}
        />

        <NumberField
          {...register("riskReward", { valueAsNumber: true })}
          label="Risk Reward"
        />

        {/* Submit Buttons */}
        {isDirty ? (
          <div className="flex flex-row gap-2">
            <Button type="button" className="flex-1" onClick={() => reset()}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || isSubmitting}
            >
              {isPending || isSubmitting ? (
                <Loader className="animate-spin size-3" />
              ) : (
                "Update"
              )}
            </Button>
          </div>
        ) : (
          <SubmitButton
            disabled={isPending}
            className="w-24 right-[40px]"
            label={
              isPending ? <Loader className="animate-spin size-3" /> : "Submit"
            }
          />
        )}
      </form>
    </FormProvider>
  );
};

export default UpdateTradeForm;
