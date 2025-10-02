import { Separator } from "@/components/ui/separator";
import { useCreateTradeSetup } from "@/hooks/trade-setup/use-create-trade-setup";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import NumberField from "../components/number-field";
import SubmitButton from "../components/submit-button";
import TextField from "../components/text-field";
import { useExistingValues } from "../hooks/use-existing-values";
import {
  addTradeSetupSchema,
  AddTradeSetupSchema,
} from "../schemas/add-trade-schema";
import { createAddTradeSetupDefaultValues } from "../schemas/default-values";
import Direction from "./direction";
import Result from "./result";
import StatusOptions from "./status-options";
import Timeframes from "./timeframes";

interface Props {
  imageId: Id<"tradingview_images">;
  snapshotId: Id<"snapshots">;
  tradeSetupId: Id<"trade_setups">;
}

const AddTradeForm = ({ snapshotId, imageId, tradeSetupId }: Props) => {
  const navigate = useNavigate();
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
    tradeSetupId,
  });

  const form = useForm<AddTradeSetupSchema>({
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

  const { register, control, handleSubmit, watch } = form;

  const { mutateAsync: createTradeSetup, isPending: isPendingSubmit } =
    useCreateTradeSetup({
      onSuccess: ({ tradeSetupId, snapshotId }) => {
        navigate({
          to: "/trade_onboarding/add_template",
          search: {
            tradeSetupId,
            imageId,
            snapshotId,
          },
        });
      },
    });
  // Watch status to conditionally render result field
  const status = watch("status");

  const onSubmit = (data: AddTradeSetupSchema) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { creationTime, timeframe, ...formData } = data;
    createTradeSetup({ ...formData, imageId });
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
        <TextField
          {...register("timeframe")}
          label="Timeframe"
          value="4h"
          disabled
          className="text-muted-foreground"
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
          placeholder={smartTitle?.title}
        />

        <Controller
          name="direction"
          control={control}
          render={({ field }) => <Direction field={field} label="Direction" />}
        />

        <Controller
          name="status"
          control={control}
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
                disabled={!!existingTradeSetup?.result}
                existingResult={existingTradeSetup?.result}
              />
            )}
          />
        )}

        <Controller
          name="timeframes"
          control={control}
          render={({ field }) => (
            <Timeframes field={field} label="Timeframes" />
          )}
        />

        <NumberField
          {...register("riskReward", { valueAsNumber: true })}
          label="Risk / Reward"
          placeholder="3.2"
        />

        <SubmitButton
          disabled={isPendingSubmit || isLoading}
          className="w-24 right-[40px]"
          label={
            isPendingSubmit ? (
              <Loader className="animate-spin size-3" />
            ) : (
              "Submit"
            )
          }
        />
      </form>
    </FormProvider>
  );
};

export default AddTradeForm;
