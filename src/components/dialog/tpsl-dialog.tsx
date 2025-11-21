import NumberField from "@/components/form/components/number-field";
import {
  TPSLFormData,
  createTpslFormSchema,
} from "@/components/form/schemas/tpsl-schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import React, { useEffect } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { toast } from "sonner";

interface TPSLDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direction: "long" | "short";
}

export function TPSLDialog({ open, onOpenChange, direction }: TPSLDialogProps) {
  const form = useForm<TPSLFormData>({
    resolver: zodResolver(createTpslFormSchema(direction)),
    defaultValues: {
      takeProfits: [{ price: undefined, weight: 100 }],
      stopLosses: [{ price: undefined, weight: 100 }],
    },
    mode: "onChange",
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    getValues,
    formState: { errors, isValid },
  } = form;

  const {
    fields: tpFields,
    append: appendTP,
    remove: removeTP,
  } = useFieldArray({
    control,
    name: "takeProfits",
  });

  const {
    fields: slFields,
    append: appendSL,
    remove: removeSL,
  } = useFieldArray({
    control,
    name: "stopLosses",
  });

  // Watch form state for debug display
  const formData = watch();

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset({
        takeProfits: [{ price: undefined, weight: 100 }],
        stopLosses: [{ price: undefined, weight: 100 }],
      });
    }
  }, [open, reset]);

  // Helper function to calculate leftover weight for an array
  const calculateLeftoverWeight = (
    arrayName: "takeProfits" | "stopLosses",
    currentIndex: number
  ): number => {
    const currentArray = getValues(arrayName);
    const otherWeightsSum = currentArray.reduce(
      (sum, entry, index) =>
        index !== currentIndex ? sum + (entry.weight || 0) : sum,
      0
    );
    return Math.max(0, 100 - otherWeightsSum);
  };

  // Helper function to handle weight change with auto-adjustment
  const handleWeightChange = (
    arrayName: "takeProfits" | "stopLosses",
    index: number,
    value: number,
    onChange: (value: number) => void,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const leftover = calculateLeftoverWeight(arrayName, index);
    const finalValue = Math.min(value, leftover);

    onChange(finalValue);

    if (value > leftover) {
      // Use setTimeout to ensure the value is set before blurring
      setTimeout(() => {
        event.target.blur();
      }, 0);
    }
  };

  // Calculate total weight for each section separately
  const tpTotal =
    formData.takeProfits?.reduce(
      (sum, entry) => sum + (entry.weight || 0),
      0
    ) || 0;
  const slTotal =
    formData.stopLosses?.reduce((sum, entry) => sum + (entry.weight || 0), 0) ||
    0;

  const onSubmit = () => {
    toast.success("TP/SL configured successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Take Profit / Stop Loss</DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Form-level validation errors */}
            {((errors.takeProfits &&
              typeof errors.takeProfits === "object" &&
              "message" in errors.takeProfits) ||
              (errors.stopLosses &&
                typeof errors.stopLosses === "object" &&
                "message" in errors.stopLosses) ||
              errors.root) && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                {(errors.takeProfits &&
                  typeof errors.takeProfits === "object" &&
                  "message" in errors.takeProfits &&
                  (errors.takeProfits.message as string)) ||
                  (errors.stopLosses &&
                    typeof errors.stopLosses === "object" &&
                    "message" in errors.stopLosses &&
                    (errors.stopLosses.message as string)) ||
                  errors.root?.message}
              </div>
            )}

            {/* Take Profits Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Take Profits</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendTP({ price: undefined, weight: 0 })}
                  disabled={tpTotal >= 100}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {tpFields.map((field, index) => {
                const isSingleEntry = tpFields.length === 1;
                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-[1fr_2.5rem] gap-2 items-start p-3 border rounded-lg"
                  >
                    <div className="space-y-2 min-w-0">
                      <NumberField
                        {...register(`takeProfits.${index}.price`, {
                          valueAsNumber: true,
                          setValueAs: (v) => {
                            const num =
                              typeof v === "string" ? parseFloat(v) : v;
                            return isNaN(num) || num === 0 ? undefined : num;
                          },
                        })}
                        label="Price"
                        placeholder="86.000"
                      />
                      <Controller
                        name={`takeProfits.${index}.weight`}
                        control={control}
                        render={({
                          field: { value, onChange, onBlur, ...field },
                        }) => (
                          <NumberField
                            {...field}
                            value={value ?? 0}
                            onChange={(e) => {
                              const numValue = parseFloat(e.target.value) || 0;
                              handleWeightChange(
                                "takeProfits",
                                index,
                                numValue,
                                onChange,
                                e
                              );
                            }}
                            onBlur={(e) => {
                              const numValue = parseFloat(e.target.value) || 0;
                              const leftover = calculateLeftoverWeight(
                                "takeProfits",
                                index
                              );
                              if (numValue > leftover) {
                                onChange(leftover);
                              }
                              onBlur();
                            }}
                            label="Weight (%)"
                            placeholder="0"
                          />
                        )}
                      />
                      {(errors.takeProfits?.[index]?.price ||
                        errors.takeProfits?.[index]?.weight) && (
                        <div className="text-xs text-destructive">
                          {errors.takeProfits?.[index]?.price?.message ||
                            errors.takeProfits?.[index]?.weight?.message}
                        </div>
                      )}
                    </div>
                    {isSingleEntry ? (
                      <div className="w-10" />
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTP(index)}
                        className="mt-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stop Losses Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Stop Losses</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendSL({ price: undefined, weight: 0 })}
                  disabled={slTotal >= 100}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              {slFields.map((field, index) => {
                const isSingleEntry = slFields.length === 1;
                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-[1fr_2.5rem] gap-2 items-start p-3 border rounded-lg"
                  >
                    <div className="space-y-2 min-w-0">
                      <NumberField
                        {...register(`stopLosses.${index}.price`, {
                          valueAsNumber: true,
                          setValueAs: (v) => {
                            const num =
                              typeof v === "string" ? parseFloat(v) : v;
                            return isNaN(num) || num === 0 ? undefined : num;
                          },
                        })}
                        label="Price"
                        placeholder="86.000"
                      />
                      <Controller
                        name={`stopLosses.${index}.weight`}
                        control={control}
                        render={({
                          field: { value, onChange, onBlur, ...field },
                        }) => (
                          <NumberField
                            {...field}
                            value={value ?? 0}
                            onChange={(e) => {
                              const numValue = parseFloat(e.target.value) || 0;
                              handleWeightChange(
                                "stopLosses",
                                index,
                                numValue,
                                onChange,
                                e
                              );
                            }}
                            onBlur={(e) => {
                              const numValue = parseFloat(e.target.value) || 0;
                              const leftover = calculateLeftoverWeight(
                                "stopLosses",
                                index
                              );
                              if (numValue > leftover) {
                                onChange(leftover);
                              }
                              onBlur();
                            }}
                            label="Weight (%)"
                            placeholder="0"
                          />
                        )}
                      />
                      {(errors.stopLosses?.[index]?.price ||
                        errors.stopLosses?.[index]?.weight) && (
                        <div className="text-xs text-destructive">
                          {errors.stopLosses?.[index]?.price?.message ||
                            errors.stopLosses?.[index]?.weight?.message}
                        </div>
                      )}
                    </div>
                    {isSingleEntry ? (
                      <div className="w-10" />
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSL(index)}
                        className="mt-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Debug JSON Display */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold">Debug JSON:</h4>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </div>

            {/* Form-level errors */}
            {errors.root && (
              <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
                {errors.root.message}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!isValid}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
