/* eslint-disable @typescript-eslint/no-unused-vars */
import { Separator } from "@/components/ui/separator";
import { useCreateSnapshot } from "@/hooks/snapshots/use-create-snapshot";
import { useCreateTradeSetup } from "@/hooks/trade-setup/use-create-trade-setup";
import { useUpdateTradeSetup } from "@/hooks/trade-setup/use-update-trade-setup";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import NumberField from "../components/number-field";
import SubmitButton from "../components/submit-button";
import TextField from "../components/text-field";
import Direction from "../features/direction";
import Result from "../features/result";
import SingleTimeframe from "../features/single-timeframe";
import StatusOptions from "../features/status-options";
import Timeframes from "../features/timeframes";
import { useExistingValues } from "../hooks/use-existing-values";
import {
  addTradeSetupSchema,
  AddTradeSetupSchema,
  createSnapshotSchema,
  createTradeSetupSchema,
  UnionKeys,
  updateTradeSetupSchema,
} from "../schemas/add-trade-schema";
import { createAddTradeSetupDefaultValues } from "../schemas/default-values";

interface Props {
  imageId: Id<"tradingview_images">;
  snapshotId: Id<"snapshots">;
  attach?: boolean;
  disabledFields?: UnionKeys<AddTradeSetupSchema>[];
}

const AddTradeForm = ({
  snapshotId,
  imageId,
  attach,
  disabledFields,
}: Props) => {
  const navigate = useNavigate();
  const search = useSearch({ from: "/trade_onboarding/add_trade" });
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

  const tradeSetupId = existingTradeSetup?._id;

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

  const { mutateAsync: createTradeSetup, isPending: isPendingSubmit } =
    useCreateTradeSetup({
      onSuccess: ({ tradeSetupId, snapshotId }) => {
        handleNavigate({ imageId, snapshotId, tradeSetupId });
      },
    });
  const { mutateAsync: updateTradeSetup, isPending: isPendingUpdateSubmit } =
    useUpdateTradeSetup({
      onSuccess: ({ tradeSetupId, snapshotId }) =>
        handleNavigate({ imageId, snapshotId, tradeSetupId }),
    });
  const { mutateAsync: createSnapshot, isPending: isPendingCreateSnapshot } =
    useCreateSnapshot({});
  // Watch status to conditionally render result field
  const status = watch("status");

  // Watch timeframe field and automatically add to timeframes array
  const timeframe = watch("timeframe");

  form.subscribe({
    name: "timeframe",
    callback({ values }) {
      if (values.timeframe && values.timeframe.trim() !== "") {
        const currentTimeframes = Array.isArray(values.timeframes)
          ? values.timeframes
          : [];
        if (!currentTimeframes.includes(values.timeframe)) {
          form.setValue("timeframes", [...currentTimeframes, values.timeframe]);
        }
      }
    },
  });

  const onAttachSubmit = async (data: AddTradeSetupSchema) => {
    if (!tradeSetupId) throw new Error("No trade setup found");

    // Parse and sanitize data for createSnapshot
    const snapshotData = createSnapshotSchema.parse({
      tradeSetupId,
      imageId,
      ...data,
    });

    const snapshot = await createSnapshot(snapshotData);

    // Parse and sanitize data for updateTradeSetup
    const updateData = updateTradeSetupSchema.parse({
      id: tradeSetupId,
      snapshotId: snapshot.snapshotId,
      imageId,
      ...data,
    });

    updateTradeSetup(updateData);
  };
  const onCreateSubmit = (data: AddTradeSetupSchema) => {
    createTradeSetup({ ...createTradeSetupSchema.parse(data), imageId });
  };
  const onUpdateSubmit = (data: AddTradeSetupSchema) => {
    if (!tradeSetupId) throw new Error("No trade setup found");
    updateTradeSetup(
      updateTradeSetupSchema.parse({ id: tradeSetupId, snapshotId, ...data })
    );
  };

  const isPending =
    isPendingCreateSnapshot || isPendingSubmit || isPendingUpdateSubmit;

  const getSubmitHandler = () => {
    if (attach) return onAttachSubmit;
    if (!tradeSetupId) return onCreateSubmit;
    return onUpdateSubmit;
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col space-y-3 px-4 py-3"
        onSubmit={handleSubmit(getSubmitHandler())}
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
          name="timeframe"
          control={control}
          disabled={disabledFields?.includes("timeframe")}
          render={({ field }) => (
            <SingleTimeframe field={field} label="Timeframe" />
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
          name="timeframes"
          control={control}
          disabled={disabledFields?.includes("timeframes")}
          render={({ field }) => (
            <Timeframes
              field={field}
              label="Timeframes"
              singleTimeframe={timeframe}
            />
          )}
        />

        <NumberField
          {...register("riskReward", { valueAsNumber: true })}
          label="Risk / Reward"
          disabled={disabledFields?.includes("riskReward")}
          placeholder="3.2"
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
