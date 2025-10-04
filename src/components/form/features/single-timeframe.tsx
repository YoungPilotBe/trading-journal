import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Timeframe, TIMEFRAMES } from "@/config/timeframe-order";
import { useState } from "react";
import { ControllerRenderProps, useFormState } from "react-hook-form";
import { AddTradeSetupSchema } from "../schemas/add-trade-schema";

type Props = {
  field: ControllerRenderProps<AddTradeSetupSchema, "timeframe">;
  label: string;
  disabled?: boolean;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "onClick" | "onBlur" | "name" | "id"
>;

function isValidTimeframe(timeframe: string): boolean {
  return timeframe.trim()
    ? TIMEFRAMES.includes(timeframe.trim() as Timeframe)
    : true;
}

const SingleTimeframe = ({ field, label, disabled, ...props }: Props) => {
  const { errors } = useFormState({ name: field.name });
  const error = errors[field.name]?.message;
  const hasError = !!error;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(field.value || "");

  const handleSave = () => {
    if (editValue.trim() !== "" && isValidTimeframe(editValue.trim())) {
      field.onChange(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(field.value || "");
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-[30%_1fr_2.25rem] items-center font-mono">
      <label className="text-xs text-muted" htmlFor={field.name}>
        {label}
      </label>
      <div className="flex justify-end">
        <div className="flex flex-row gap-1 items-center max-w-full overflow-hidden">
          {isEditing && !disabled ? (
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  handleCancel();
                }
              }}
              onBlur={handleSave}
              autoFocus
              disabled={disabled}
              className={`w-16 h-6 px-1 py-0.5 border font-mono text-xs rounded-sm bg-transparent !outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                isValidTimeframe(editValue)
                  ? "border-muted text-muted-foreground"
                  : "border-red-400/70 text-red-400"
              }`}
              placeholder="4h"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditValue(field.value || "");
                setIsEditing(true);
              }}
              disabled={disabled}
              className="px-2 py-0.5 border border-muted text-muted-foreground font-mono text-xs rounded-sm transition-all cursor-pointer hover:border-muted-foreground/50 hover:text-muted-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[2rem]"
              title="Click to edit timeframe"
              {...props}
            >
              {field.value || "Select"}
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-center">
        {hasError ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse starting:size-0 transition-all" />
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

export default SingleTimeframe;
