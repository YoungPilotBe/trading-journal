import NumberField from "@/components/form/components/number-field";
import {
  TPSLFormData,
  TPSLFormInput,
  createTpslFormSchema,
} from "@/components/form/schemas/tpsl-schema";
import {
  calculateLeftoverMargin,
  calculateLeftoverMarginForNewEntry,
  calculateTotalMargin,
  handleMarginChange,
} from "@/components/form/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  FormProvider,
  UseFormRegister,
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
  readonly?: boolean;
}

interface TpslEntryRowProps {
  entry:
    | TPSLFormInput["takeProfits"][number]
    | TPSLFormInput["stopLosses"][number];
  index: number;
  arrayName: "takeProfits" | "stopLosses";
  control: Control<TPSLFormInput>;
  register: UseFormRegister<TPSLFormInput>;
  errors: FieldErrors<TPSLFormInput>;
  isSingleEntry: boolean;
  onRemove: () => void;
  array: TPSLFormInput["takeProfits"] | TPSLFormInput["stopLosses"];
  readonly?: boolean;
}

// Component for a single TP/SL entry row
function TpslEntryRow({
  entry,
  index,
  arrayName,
  control,
  register,
  errors,
  isSingleEntry,
  onRemove,
  array,
  readonly = false,
}: TpslEntryRowProps) {
  // Check if entry was already hit in a previous submission (has hitSnapshotId)
  const wasAlreadyHit = !!entry?.hitSnapshotId;
  const isHit = entry?.isHit ?? false;
  // Entry is hit if it was previously hit OR currently marked as hit
  const entryIsHit = wasAlreadyHit || isHit;
  // Disable if entry was already hit (cannot unhit or modify) or if readonly
  const isDisabled = wasAlreadyHit || readonly;

  return (
    <div className="grid grid-cols-[2.5rem_1fr_2.5rem] gap-2 items-start p-3 border rounded-none">
      {/* Checkbox column on the left */}
      <div className="flex items-center justify-center pt-2">
        <Controller
          name={`${arrayName}.${index}.isHit`}
          control={control}
          render={({ field: checkboxField }) => (
            <Checkbox
              checked={checkboxField.value ?? false}
              disabled={isDisabled}
              onCheckedChange={(checked) => {
                checkboxField.onChange(checked);
              }}
              aria-label="Entry hit"
              className="size-6"
            />
          )}
        />
      </div>

      {/* Main content column */}
      <div className="space-y-2 min-w-0">
        <NumberField
          tabIndex={-1}
          disabled={isDisabled}
          {...register(`${arrayName}.${index}.price`, {
            valueAsNumber: true,
            setValueAs: (v: string | number) => {
              const num = typeof v === "string" ? parseFloat(v) : v;
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
          name={`${arrayName}.${index}.margin`}
          control={control}
          render={({ field: { value, onChange, onBlur, ...field } }) => (
            <NumberField
              {...field}
              tabIndex={-1}
              disabled={isDisabled}
              value={value ?? 0}
              onChange={(e) => {
                const numValue = parseFloat(e.target.value) || 0;
                handleMarginChange(array, index, numValue, onChange, e);
              }}
              onBlur={(e) => {
                const numValue = parseFloat(e.target.value) || 0;
                const leftover = calculateLeftoverMargin(array, index);
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
        {(errors[arrayName]?.[index]?.price ||
          errors[arrayName]?.[index]?.margin) && (
          <div className="text-xs text-destructive">
            {errors[arrayName]?.[index]?.price?.message ||
              errors[arrayName]?.[index]?.margin?.message}
          </div>
        )}
      </div>
      {/* Trash icon column on the right */}
      {isSingleEntry || entryIsHit || readonly ? (
        <div className="w-10" />
      ) : (
        <Button
          type="button"
          variant="ghost"
          onClick={onRemove}
          className="mt-2 h-6 w-6 p-0 hover:text-rose-500"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function TPSLDialog({
  open,
  onOpenChange,
  direction,
  initialValues,
  onSave,
  readonly = false,
}: TPSLDialogProps) {
  const defaultValues: TPSLFormInput = initialValues || {
    entryPrice: undefined,
    takeProfits: [{ price: undefined, margin: 100 }],
    stopLosses: [{ price: undefined, margin: 100 }],
  };

  const form = useForm<TPSLFormInput>({
    resolver: zodResolver(createTpslFormSchema(direction)),
    defaultValues,
    mode: "onChange",
  });

  // Update resolver when direction changes
  useEffect(() => {
    form.clearErrors();
  }, [direction, form]);

  const {
    register,
    control,
    handleSubmit,
    watch,
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

  const formData = watch();

  // Calculate total margin for each section separately
  const tpTotal = calculateTotalMargin(formData.takeProfits || []);
  const slTotal = calculateTotalMargin(formData.stopLosses || []);

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
          <DialogTitle>
            {readonly
              ? "View Take Profit / Stop Loss"
              : "Configure Take Profit / Stop Loss"}
          </DialogTitle>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Entry Price Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono text-muted-foreground">
                Entry Price
              </h3>
              <div className="grid grid-cols-[2.5rem_1fr_2.5rem] gap-2 items-start p-3 border rounded-none">
                {/* Empty column on the left to match checkbox column */}
                <div className="w-10" />

                {/* Main content column */}
                <div className="space-y-2 min-w-0">
                  <NumberField
                    tabIndex={-1}
                    disabled={readonly}
                    {...register("entryPrice", {
                      valueAsNumber: true,
                      required: "Entry price is required",
                    })}
                    label={{
                      value: "Price",
                      className: "text-muted-foreground",
                    }}
                    placeholder="86.000"
                  />
                  {errors.entryPrice && (
                    <div className="text-xs text-destructive">
                      {errors.entryPrice.message}
                    </div>
                  )}
                </div>

                {/* Empty column on the right to match trash icon column */}
                <div className="w-10" />
              </div>
            </div>

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
                <h3 className="text-xs font-mono text-muted-foreground">
                  Take Profits
                </h3>
                {!readonly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const leftover = calculateLeftoverMarginForNewEntry(
                        formData.takeProfits || []
                      );
                      appendTP({
                        price: undefined,
                        margin: leftover,
                        isHit: false,
                      });
                    }}
                    disabled={tpTotal >= 100}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>

              {tpFields.map((field, index) => {
                const isSingleEntry = tpFields.length === 1;
                const entry = formData.takeProfits?.[index];
                return (
                  <TpslEntryRow
                    key={field.id}
                    entry={entry}
                    index={index}
                    arrayName="takeProfits"
                    control={control}
                    register={register}
                    errors={errors}
                    isSingleEntry={isSingleEntry}
                    onRemove={() => removeTP(index)}
                    array={formData.takeProfits || []}
                    readonly={readonly}
                  />
                );
              })}
            </div>

            {/* Stop Losses Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono text-muted-foreground">
                  Stop Losses
                </h3>
                {!readonly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const leftover = calculateLeftoverMarginForNewEntry(
                        formData.stopLosses || []
                      );
                      appendSL({
                        price: undefined,
                        margin: leftover,
                        isHit: false,
                      });
                    }}
                    disabled={slTotal >= 100}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>

              {slFields.map((field, index) => {
                const isSingleEntry = slFields.length === 1;
                const entry = formData.stopLosses?.[index];
                return (
                  <TpslEntryRow
                    key={field.id}
                    entry={entry}
                    index={index}
                    arrayName="stopLosses"
                    control={control}
                    register={register}
                    errors={errors}
                    isSingleEntry={isSingleEntry}
                    onRemove={() => removeSL(index)}
                    array={formData.stopLosses || []}
                    readonly={readonly}
                  />
                );
              })}
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
                {readonly ? "Close" : "Cancel"}
              </Button>
              {!readonly && (
                <Button type="submit" disabled={!isValid}>
                  Save
                </Button>
              )}
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
