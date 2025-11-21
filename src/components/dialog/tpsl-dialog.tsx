import NumberField from "@/components/form/components/number-field";
import {
  TPSLFormData,
  TPSLFormInput,
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
  initialValues?: TPSLFormInput;
  onSave?: (data: TPSLFormData) => void;
}

export function TPSLDialog({
  open,
  onOpenChange,
  direction,
  initialValues,
  onSave,
}: TPSLDialogProps) {
  const defaultValues: TPSLFormInput = initialValues || {
    takeProfits: [{ price: undefined, margin: 100 }],
    stopLosses: [{ price: undefined, margin: 100 }],
  };

  const form = useForm<TPSLFormInput>({
    resolver: zodResolver(createTpslFormSchema(direction)),
    defaultValues,
    mode: "onChange",
  });

  // Reset form when initialValues or direction changes
  useEffect(() => {
    if (open) {
      const valuesToUse: TPSLFormInput = initialValues || {
        takeProfits: [{ price: undefined, margin: 100 }],
        stopLosses: [{ price: undefined, margin: 100 }],
      };
      form.reset(valuesToUse);
      form.clearErrors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, direction]);

  // Update resolver when direction changes
  useEffect(() => {
    form.clearErrors();
  }, [direction, form]);

  const {
    register,
    control,
    handleSubmit,
    watch,
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

  // Helper function to calculate leftover margin for an array
  const calculateLeftoverMargin = (
    arrayName: "takeProfits" | "stopLosses",
    currentIndex: number
  ): number => {
    const currentArray = getValues(arrayName);
    const otherMarginsSum = currentArray.reduce(
      (sum, entry, index) =>
        index !== currentIndex ? sum + (entry.margin || 0) : sum,
      0
    );
    return Math.max(0, 100 - otherMarginsSum);
  };

  // Helper function to calculate leftover margin for a new entry
  const calculateLeftoverMarginForNewEntry = (
    arrayName: "takeProfits" | "stopLosses"
  ): number => {
    const currentArray = getValues(arrayName);
    const totalMargin = currentArray.reduce(
      (sum, entry) => sum + (entry.margin || 0),
      0
    );
    return Math.max(0, 100 - totalMargin);
  };

  // Helper function to handle margin change with auto-adjustment
  const handleMarginChange = (
    arrayName: "takeProfits" | "stopLosses",
    index: number,
    value: number,
    onChange: (value: number) => void,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const leftover = calculateLeftoverMargin(arrayName, index);
    const finalValue = Math.min(value, leftover);

    onChange(finalValue);

    if (value > leftover) {
      // Use setTimeout to ensure the value is set before blurring
      setTimeout(() => {
        event.target.blur();
      }, 0);
    }
  };

  // Calculate total margin for each section separately
  const tpTotal =
    formData.takeProfits?.reduce(
      (sum, entry) => sum + (entry.margin || 0),
      0
    ) || 0;
  const slTotal =
    formData.stopLosses?.reduce((sum, entry) => sum + (entry.margin || 0), 0) ||
    0;

  const onSubmit = (data: TPSLFormInput) => {
    // The schema transform will convert input to output (filtering undefined prices)
    const validatedData = createTpslFormSchema(direction).parse(data);

    // Call onSave callback if provided
    if (onSave) {
      onSave(validatedData);
    }
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
                  onClick={() => {
                    const leftover =
                      calculateLeftoverMarginForNewEntry("takeProfits");
                    appendTP({ price: undefined, margin: leftover });
                  }}
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
                    className="grid grid-cols-[1fr_2.5rem] gap-2 items-start p-3 border rounded-none"
                  >
                    <div className="space-y-2 min-w-0">
                      <NumberField
                        tabIndex={-1}
                        {...register(`takeProfits.${index}.price`, {
                          valueAsNumber: true,
                          setValueAs: (v) => {
                            const num =
                              typeof v === "string" ? parseFloat(v) : v;
                            return isNaN(num) || num === 0 ? undefined : num;
                          },
                        })}
                        label={{
                          value: "Price",
                          className: "text-muted-foreground",
                        }}
                        placeholder="86.000"
                      />
                      <Controller
                        name={`takeProfits.${index}.margin`}
                        control={control}
                        render={({
                          field: { value, onChange, onBlur, ...field },
                        }) => (
                          <NumberField
                            {...field}
                            tabIndex={-1}
                            value={value ?? 0}
                            onChange={(e) => {
                              const numValue = parseFloat(e.target.value) || 0;
                              handleMarginChange(
                                "takeProfits",
                                index,
                                numValue,
                                onChange,
                                e
                              );
                            }}
                            onBlur={(e) => {
                              const numValue = parseFloat(e.target.value) || 0;
                              const leftover = calculateLeftoverMargin(
                                "takeProfits",
                                index
                              );
                              if (numValue > leftover) {
                                onChange(leftover);
                              }
                              onBlur();
                            }}
                            label={{
                              value: "Margin (%)",
                              className: "text-muted-foreground",
                            }}
                            placeholder="0"
                          />
                        )}
                      />
                      {(errors.takeProfits?.[index]?.price ||
                        errors.takeProfits?.[index]?.margin) && (
                        <div className="text-xs text-destructive">
                          {errors.takeProfits?.[index]?.price?.message ||
                            errors.takeProfits?.[index]?.margin?.message}
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
                  onClick={() => {
                    const leftover =
                      calculateLeftoverMarginForNewEntry("stopLosses");
                    appendSL({ price: undefined, margin: leftover });
                  }}
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
                    className="grid grid-cols-[1fr_2.5rem] gap-2 items-start p-3 border rounded-none"
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
                        tabIndex={-1}
                        label={{
                          value: "Price",
                          className: "text-muted-foreground",
                        }}
                        placeholder="86.000"
                      />
                      <Controller
                        name={`stopLosses.${index}.margin`}
                        control={control}
                        render={({
                          field: { value, onChange, onBlur, ...field },
                        }) => (
                          <NumberField
                            {...field}
                            value={value ?? 0}
                            tabIndex={-1}
                            onChange={(e) => {
                              const numValue = parseFloat(e.target.value) || 0;
                              handleMarginChange(
                                "stopLosses",
                                index,
                                numValue,
                                onChange,
                                e
                              );
                            }}
                            onBlur={(e) => {
                              const numValue = parseFloat(e.target.value) || 0;
                              const leftover = calculateLeftoverMargin(
                                "stopLosses",
                                index
                              );
                              if (numValue > leftover) {
                                onChange(leftover);
                              }
                              onBlur();
                            }}
                            label={{
                              value: "Margin (%)",
                              className: "text-muted-foreground",
                            }}
                            placeholder="0"
                          />
                        )}
                      />
                      {(errors.stopLosses?.[index]?.price ||
                        errors.stopLosses?.[index]?.margin) && (
                        <div className="text-xs text-destructive">
                          {errors.stopLosses?.[index]?.price?.message ||
                            errors.stopLosses?.[index]?.margin?.message}
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
