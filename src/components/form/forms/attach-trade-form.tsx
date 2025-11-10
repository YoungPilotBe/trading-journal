/* eslint-disable @typescript-eslint/no-unused-vars */
import { Separator } from "@/components/ui/separator";
import { Timeframe } from "@/config/timeframe-order";
import { useAttachSnapshot } from "@/hooks/snapshots/use-attach-snapshot";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import NumberField from "../components/number-field";
import SubmitButton from "../components/submit-button";
import TextField from "../components/text-field";
import EmotionOptions from "../features/emotion-selector";
import Result from "../features/result";
import SingleTimeframe from "../features/single-timeframe";
import StatusOptions from "../features/status-options";
import Timeframes from "../features/timeframes";
import { useExistingValues } from "../hooks/use-existing-values";
import {
  attachTradeSchema,
  attachTradeSetupSchema,
  createSnapshotSchema,
  OrchestratedTradeSetupSchema,
  UnionKeys,
} from "../schemas/add-trade-schema";
import { addTimeframeToTimeframes } from "../utils";

interface Props {
  imageId: Id<"tradingview_images">;
  snapshotId: Id<"snapshots">;
  tradeSetupId: Id<"trade_setups">;
  disabledFields?: UnionKeys<OrchestratedTradeSetupSchema>[];
}

const AttachTradeForm = ({
  snapshotId,
  imageId,
  tradeSetupId,
  disabledFields,
}: Props) => {
  const navigate = useNavigate();
  const search = useSearch({ from: "/trade_onboarding/attach_trade" });
  const {
    existingSnapshot,
    existingTradeSetup,
    imageData,
    isLoading,
    previousStatuses,
  } = useExistingValues({
    snapshotId,
    imageId,
  });

  const form = useForm<z.infer<typeof attachTradeSchema>>({
    resolver: zodResolver(attachTradeSchema),
    defaultValues: {
      tradeSetupId,
      imageId,
      timeframe: imageData?.timeframe as Timeframe,
      status: existingSnapshot?.status || "idea",
      emotion: existingSnapshot?.emotion || "calm",
      riskReward: existingSnapshot?.riskReward,
      timeframes: (existingTradeSetup?.timeframes as Timeframe[]) || [],
      trade_template: existingTradeSetup?.trade_template,
    },

    mode: "onChange",
    shouldUnregister: true,
  });

  const { register, control, handleSubmit, watch } = form;

  function handleNavigate(args: {
    tradeSetupId: Id<"trade_setups">;
    imageId: Id<"tradingview_images">;
    snapshotId: Id<"snapshots">;
  }) {
    const newSearch = { ...search, ...args };
    navigate({
      from: "/trade_onboarding/attach_trade",
      search: newSearch,
      replace: true,
    });
    navigate({
      to: "/trade_onboarding/add_template",
      search: newSearch,
    });
  }

  const { mutateAsync: attachSnapshot, isPending } = useAttachSnapshot({
    onSuccess: ({ snapshotId, tradeSetupId }) => {
      handleNavigate({ imageId, snapshotId, tradeSetupId });
    },
  });

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

  const onSubmit = async (data: z.infer<typeof attachTradeSchema>) => {
    const tradeSetup = attachTradeSetupSchema.parse({
      ...data,
    });
    const snapshot = createSnapshotSchema.parse({ ...data, imageId });

    attachSnapshot({
      tradeSetup: { ...tradeSetup, id: tradeSetupId },
      snapshot,
    });
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col space-y-3 px-4 py-3"
        onSubmit={handleSubmit(onSubmit, (data) =>
          toast.error(JSON.stringify(data))
        )}
      >
        <TextField
          label="Asset"
          value={imageData?.asset}
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
            imageData?._creationTime &&
            format(new Date(imageData?._creationTime), "HH:mm")
          }
          disabled
          className="text-muted-foreground"
        />

        <Separator />

        <TextField value={existingTradeSetup?.title} label="Title" disabled />

        <TextField
          value={existingTradeSetup?.direction}
          label="Direction"
          disabled
        />

        <Controller
          name="status"
          control={control}
          disabled={disabledFields?.includes("status")}
          render={({ field }) => (
            <StatusOptions
              field={field}
              label="Status"
              previousStatuses={previousStatuses}
              existingSnapshot={existingSnapshot}
              existingTradeSetup={existingTradeSetup}
            />
          )}
        />

        {/* Only render result field when status is "closed" or there's an existing result */}
        {(status === "closed" || existingTradeSetup?.result) && (
          <Controller
            name="result"
            control={control}
            render={({ field }) => (
              <Result
                field={field}
                label="Result"
                disabled={
                  !!existingTradeSetup?.result ||
                  disabledFields?.includes("result")
                }
                existingResult={existingTradeSetup?.result}
              />
            )}
          />
        )}

        <Controller
          name="emotion"
          control={control}
          disabled={disabledFields?.includes("emotion")}
          render={({ field }) => (
            <EmotionOptions field={field} label="Emotion" />
          )}
        />

        <Controller
          name="timeframes"
          control={control}
          disabled={disabledFields?.includes("timeframes")}
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

        <SubmitButton
          disabled={isPending || isLoading}
          className="w-24 right-[40px]"
          label={
            isPending ? <Loader className="animate-spin size-3" /> : "Submit"
          }
        />
      </form>
    </FormProvider>
  );
};

export default AttachTradeForm;
