/* eslint-disable @typescript-eslint/no-unused-vars */
import { Separator } from "@/components/ui/separator";
import { Timeframe } from "@/config/timeframe-order";
import { useDialog } from "@/contexts/dialog-context";
import { useAttachSnapshot } from "@/hooks/snapshots/use-attach-snapshot";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Doc, Id } from "convex/_generated/dataModel";
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
import StatusOptions from "../features/status-options";
import TimeframesGeneric from "../features/timeframes-generic";
import { TPSLOverview } from "../features/tpsl-overview";
import {
  attachTradeSchema,
  OrchestratedTradeSetupSchema,
  splitAttachTradeData,
  UnionKeys,
} from "../schemas/add-trade-schema";
import { TPSLFormData, TPSLFormInput } from "../schemas/tpsl-schema";
import { transformTpslEntriesToFormInput } from "../utils";

interface Props {
  imageId: Id<"tradingview_images">;
  snapshotId: Id<"snapshots">;
  tradeSetupId: Id<"trade_setups">;
  disabledFields?: UnionKeys<OrchestratedTradeSetupSchema>[];
  existingTradeSetup?: Doc<"trade_setups"> | null;
  existingSnapshot?: Doc<"snapshots"> | null;
  imageData?: (Doc<"tradingview_images"> & { url: string | null }) | null;
  previousStatuses: Doc<"snapshots">["status"][];
  tpslEntries: Doc<"tpsl_entries">[];
}

const AttachTradeForm = ({
  imageId,
  tradeSetupId,
  disabledFields,
  existingTradeSetup,
  existingSnapshot,
  imageData,
  previousStatuses,
  tpslEntries,
}: Props) => {
  const navigate = useNavigate();
  const search = useSearch({ from: "/trade_onboarding/attach_trade" });
  const { openDialog } = useDialog();

  const transformedTpsl = transformTpslEntriesToFormInput(
    tpslEntries,
    existingSnapshot?.entryPrice
  );

  const form = useForm<z.infer<typeof attachTradeSchema>>({
    resolver: zodResolver(attachTradeSchema),
    defaultValues: {
      imageId,
      timeframes: imageData?.timeframe
        ? [imageData.timeframe as Timeframe]
        : ([] as Timeframe[]),
      status: existingSnapshot?.status || "idea",
      emotion: existingSnapshot?.emotion || "calm",
      rMultiple: existingSnapshot?.rMultiple,
      trade_template: existingTradeSetup?.trade_template,
      direction: existingTradeSetup?.direction,
      tpsl: transformedTpsl,
    },

    mode: "onChange",
  });

  const { register, control, handleSubmit, watch, setValue } = form;

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
  // Watch tpsl to keep it registered and reactive
  const tpslValue = watch("tpsl");

  const direction = watch("direction");

  const onSubmit = async (data: z.infer<typeof attachTradeSchema>) => {
    const { tradeSetup, snapshot, tpsl } = splitAttachTradeData(data, imageId);

    await attachSnapshot({
      tradeSetup: { ...tradeSetup, id: tradeSetupId },
      snapshot,
      tpsl,
    });
  };

  function handleOpenTspl() {
    if (direction) {
      const currentTpsl = tpslValue || transformedTpsl;
      openDialog("TPSL", {
        direction,
        initialValues: currentTpsl as TPSLFormInput | undefined,
        onSave: (data: TPSLFormData) => {
          setValue("tpsl", data, { shouldValidate: true });
        },
      });
    } else {
      toast.error("No direction");
    }
  }

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
          name="timeframes"
          control={control}
          render={({ field }) => (
            <TimeframesGeneric field={field} label="Timeframes" />
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
            shouldUnregister
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

        <NumberField
          {...register("rMultiple", { valueAsNumber: true })}
          label="R-Multiple"
          placeholder="5.3"
        />

        {/* Display TP/SL summary if configured - wrapped in Controller to keep field registered */}
        <Controller
          name="tpsl"
          control={control}
          render={({ field }) => (
            <TPSLOverview
              data={field.value}
              direction={direction}
              onEdit={handleOpenTspl}
            />
          )}
        />
        <SubmitButton
          disabled={isPending}
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
