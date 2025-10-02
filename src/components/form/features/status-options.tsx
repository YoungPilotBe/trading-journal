import IStatusOptions from "@/components/status-options";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Doc } from "convex/_generated/dataModel";
import React from "react";
import { ControllerRenderProps, useFormState } from "react-hook-form";
import { AddTradeSetupSchema } from "../schemas/add-trade-schema";

type Props = {
  field: ControllerRenderProps<AddTradeSetupSchema, "status">;
  label: string;
  previousStatuses?: Doc<"snapshots">["status"][] | null;
  existingSnapshot?: Doc<"snapshots"> | null;
  existingTradeSetup?: Doc<"trade_setups"> | null;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "onClick" | "onBlur" | "name" | "id"
>;

const StatusOptions = ({
  field,
  label,
  existingTradeSetup,
  existingSnapshot,
  previousStatuses,
  ...props
}: Props) => {
  const { errors } = useFormState({ name: field.name });
  const error = errors[field.name]?.message;
  const hasError = !!error;

  return (
    <div className="grid grid-cols-[30%_1fr_2.25rem] items-center font-mono">
      <label className="text-xs text-muted" htmlFor={field.name}>
        {label}
      </label>
      <div className="flex justify-end">
        <IStatusOptions
          selected={field.value}
          onClick={(newStatus) => {
            field.onChange(newStatus);
          }}
          context={{
            isNew: !existingTradeSetup?._id,
            currentStatus: existingSnapshot?.status,
            hasExecutedTrade: previousStatuses?.includes("executed"),
            previousStatuses,
            tradeSetupId: existingTradeSetup?._id,
          }}
          {...props}
        />
      </div>
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
