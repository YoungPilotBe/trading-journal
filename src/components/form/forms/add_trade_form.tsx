/* eslint-disable @typescript-eslint/no-unused-vars */
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDialog } from "@/contexts/dialog-context";
import { useCreateTradeSetup } from "@/hooks/trade-setup/use-create-trade-setup";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { useEffect } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import NumberField from "../components/number-field";
import SubmitButton from "../components/submit-button";
import TextField from "../components/text-field";
import Direction from "../features/direction";
import EmotionOptions from "../features/emotion-selector";
import Result from "../features/result";
import StatusOptions from "../features/status-options";
import TimeframesGeneric from "../features/timeframes-generic";
import { TPSLOverview } from "../features/tpsl-overview";
import { useExistingValues } from "../hooks/use-existing-values";
import {
  addTradeSetupSchema,
  OrchestratedTradeSetupSchema,
  splitAddTradeSetupData,
  UnionKeys,
} from "../schemas/add-trade-schema";
import { createAddTradeSetupDefaultValues } from "../schemas/default-values";
import { TPSLFormData } from "../schemas/tpsl-schema";

interface Props {
  imageId: Id<"tradingview_images">;
  snapshotId: Id<"snapshots">;
  disabledFields?: UnionKeys<OrchestratedTradeSetupSchema>[];
}

const AddTradeForm = ({ snapshotId, imageId, disabledFields }: Props) => {
  const navigate = useNavigate();
  const search = useSearch({ from: "/trade_onboarding/add_trade" });
  const { openDialog } = useDialog();
  const {
    existingSnapshot,
    existingTradeSetup,
    imageData,
    isLoading,
    previousStatuses,
    smartTitle,
  } = useExistingValues({
    snapshotId,
    imageId,
  });

  const form = useForm<OrchestratedTradeSetupSchema>({
    resolver: zodResolver(addTradeSetupSchema),
    defaultValues: createAddTradeSetupDefaultValues({
      existingTradeSetup,
      existingSnapshot,
      imageData,
      smartTitle,
      previousStatuses,
    }),
    mode: "onChange",
    shouldUnregister: true,
  });

  useEffect(() => {
    toast.error(JSON.stringify(form.formState.errors.tpsl));
  }, [form.formState.errors.tpsl]);

  const { register, control, handleSubmit, watch, setValue } = form;
  const direction = watch("direction");
  const tpsl = watch("tpsl");

  function handleNavigate(args: {
    tradeSetupId: Id<"trade_setups">;
    imageId: Id<"tradingview_images">;
    snapshotId: Id<"snapshots">;
  }) {
    const newSearch = { ...search, ...args };
    navigate({
      from: "/trade_onboarding/add_trade",
      search: newSearch,
      replace: true,
    });
    navigate({
      to: "/trade_onboarding/add_template",
      search: newSearch,
    });
  }

  const { mutateAsync: createTradeSetup, isPending } = useCreateTradeSetup({
    onSuccess: ({ tradeSetupId, snapshotId }) => {
      handleNavigate({ imageId, snapshotId, tradeSetupId });
    },
  });
  // Watch status to conditionally render result field
  const status = watch("status");

  const onSubmit = (data: OrchestratedTradeSetupSchema) => {
    const { snapshot, tradeSetup, tpsl } = splitAddTradeSetupData(data);
    createTradeSetup({ tradeSetup, snapshot, tpsl, imageId });
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col space-y-3 px-4 py-3"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* Display read-only info */}
        <TextField
          {...register("asset")}
          label="Asset"
          value={imageData?.asset}
          disabled
          className="text-muted-foreground"
        />
        <Controller
          name="timeframes"
          control={control}
          disabled={disabledFields?.includes("timeframes")}
          render={({ field }) => (
            <TimeframesGeneric
              field={field}
              label="Timeframes"
              disabled={disabledFields?.includes("timeframes")}
            />
          )}
        />
        <TextField
          {...register("creationTime")}
          label="Creation Time"
          value={
            imageData?._creationTime &&
            format(new Date(imageData?._creationTime), "HH:mm")
          }
          disabled
          className="text-muted-foreground"
        />

        <Separator />

        <TextField
          {...register("title")}
          label="Title"
          disabled={disabledFields?.includes("title")}
          placeholder={smartTitle?.title}
        />

        <Controller
          name="direction"
          control={control}
          render={({ field }) => (
            <Direction
              disabled={disabledFields?.includes("direction")}
              field={field}
              label="Direction"
            />
          )}
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

        <NumberField
          {...register("rMultiple", { valueAsNumber: true })}
          label="R-Multiple"
          placeholder="5.4"
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (direction) {
              openDialog("TPSL", {
                direction,
                initialValues: tpsl,
                onSave: (data: TPSLFormData) => {
                  setValue("tpsl", data, { shouldValidate: true });
                },
              });
            }
          }}
          disabled={!direction}
          className="w-full"
        >
          Configure TP/SL
        </Button>

        {/* Display TP/SL summary if configured */}
        <TPSLOverview
          data={tpsl}
          onEdit={() =>
            openDialog("TPSL", {
              direction,
              initialValues: tpsl,
              onSave: (data: TPSLFormData) => {
                setValue("tpsl", data, { shouldValidate: true });
              },
            })
          }
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

export default AddTradeForm;
