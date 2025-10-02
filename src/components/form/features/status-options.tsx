import IStatusOptions from "@/components/status-options";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Doc } from "convex/_generated/dataModel";
import React from "react";
import {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  useFormState,
} from "react-hook-form";

type Props<T extends FieldValues> = {
  field: ControllerRenderProps<T, FieldPath<T>>;
  label?: string;
  previousStatuses?: Doc<"snapshots">["status"][] | null;
  existingSnapshot?: Doc<"snapshots"> | null;
  existingTradeSetup?: Doc<"trade_setups"> | null;
  onStatusChange?: (newStatus: Doc<"snapshots">["status"]) => void;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "onClick" | "onBlur" | "name" | "id"
>;

const StatusOptions = <T extends FieldValues>({
  field,
  label,
  existingTradeSetup,
  existingSnapshot,
  previousStatuses,
  onStatusChange,
  ...props
}: Props<T>) => {
  const { errors } = useFormState({ name: field.name });
  const error = errors[field.name]?.message;
  const hasError = !!error;

  const handleClick = (newStatus: Doc<"snapshots">["status"]) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    } else {
      field.onChange(newStatus);
    }
  };

  const content = (
    <IStatusOptions
      selected={field.value}
      onClick={handleClick}
      context={{
        isNew: !existingTradeSetup?._id,
        currentStatus: existingSnapshot?.status,
        hasExecutedTrade: previousStatuses?.includes("executed"),
        previousStatuses,
        tradeSetupId: existingTradeSetup?._id,
      }}
      {...props}
    />
  );

  // If no label, return just the status options
  if (!label) {
    return content;
  }

  return (
    <div className="grid grid-cols-[30%_1fr_2.25rem] items-center font-mono">
      <label className="text-xs text-muted" htmlFor={field.name}>
        {label}
      </label>
      <div className="flex justify-end">{content}</div>
      <div className="flex items-center justify-center">
        {hasError ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse starting:size-0 transition-all " />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">{String(error)}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="w-2 h-2" /> // Placeholder to maintain consistent spacing
        )}
      </div>
    </div>
  );
};

export default StatusOptions;
