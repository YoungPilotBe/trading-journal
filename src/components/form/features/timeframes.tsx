import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Timeframe, TIMEFRAMES } from "@/config/timeframe-order";
import { useState } from "react";
import { ControllerRenderProps, useFormState } from "react-hook-form";
import {
  AddTradeSetupSchema,
  TimeframesArrayType,
} from "../schemas/add-trade-schema";

type Props = {
  field: ControllerRenderProps<AddTradeSetupSchema, "timeframes">;
  label: string;
  disabled?: boolean;
  singleTimeframe?: string; // The value from the single timeframe field
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "onClick" | "onBlur" | "name" | "id"
>;

function isValidTimeframe(newTimeframe: string): boolean {
  return newTimeframe.trim()
    ? TIMEFRAMES.includes(newTimeframe.trim() as Timeframe)
    : true;
}

function sortTimeframes(timeframes: string[]) {
  return [...timeframes].sort((a, b) => {
    const indexA = TIMEFRAMES.indexOf(a as Timeframe);
    const indexB = TIMEFRAMES.indexOf(b as Timeframe);
    return indexA - indexB;
  });
}

const Timeframes = ({
  field,
  label,
  disabled,
  singleTimeframe,
  ...props
}: Props) => {
  const { errors } = useFormState({ name: field.name });
  const error = errors[field.name]?.message;
  const hasError = !!error;

  const [isAddingTimeframe, setIsAddingTimeframe] = useState(false);
  const [newTimeframe, setNewTimeframe] = useState("");

  // Ensure we have an array
  const currentTimeframes: TimeframesArrayType = Array.isArray(field.value)
    ? field.value
    : [];

  return (
    <div className="grid grid-cols-[30%_1fr_2.25rem] items-center font-mono">
      <label className="text-xs text-muted" htmlFor={field.name}>
        {label}
      </label>
      <div className="flex justify-end">
        <div className="flex flex-row gap-1 items-center max-w-full overflow-hidden">
          {sortTimeframes(currentTimeframes).map((timeframe) => {
            const isSingleTimeframe =
              singleTimeframe && timeframe === singleTimeframe;
            return (
              <button
                key={timeframe}
                type="button"
                onClick={() =>
                  field.onChange(
                    currentTimeframes.filter((tf) => tf !== timeframe)
                  )
                }
                disabled={disabled}
                className={`px-1 py-0.5 border font-mono text-xs rounded-sm transition-all cursor-pointer hover:border-red-400/50 hover:text-red-400/70 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-muted disabled:hover:text-muted-foreground whitespace-nowrap ${
                  isSingleTimeframe
                    ? "border-sky-400 text-sky-400"
                    : "border-muted text-muted-foreground"
                }`}
                title="Click to remove"
                {...props}
              >
                {timeframe}
              </button>
            );
          })}

          {/* Add timeframe button/input */}
          {isAddingTimeframe && !disabled ? (
            <input
              value={newTimeframe}
              onChange={(e) => setNewTimeframe(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (
                    newTimeframe.trim() !== "" &&
                    !currentTimeframes.includes(
                      newTimeframe.trim() as Timeframe
                    ) &&
                    isValidTimeframe(newTimeframe.trim())
                  ) {
                    field.onChange([...currentTimeframes, newTimeframe.trim()]);
                    setNewTimeframe("");
                    setIsAddingTimeframe(false);
                  }
                }
              }}
              onBlur={() => {
                if (
                  newTimeframe.trim() !== "" &&
                  !currentTimeframes.includes(
                    newTimeframe.trim() as Timeframe
                  ) &&
                  isValidTimeframe(newTimeframe.trim())
                ) {
                  field.onChange([...currentTimeframes, newTimeframe.trim()]);
                }
                setNewTimeframe("");
                setIsAddingTimeframe(false);
              }}
              autoFocus
              disabled={disabled}
              className={`w-10 h-6 px-1 py-0.5 border font-mono text-xs rounded-sm bg-transparent !outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                isValidTimeframe(newTimeframe)
                  ? "border-muted text-muted-foreground"
                  : "border-red-400/70 text-red-400"
              }`}
              placeholder="4h"
            />
          ) : !disabled ? (
            <button
              type="button"
              onClick={() => setIsAddingTimeframe(true)}
              disabled={disabled}
              className="px-1 py-0.5 border border-muted text-muted-foreground font-mono text-xs rounded-sm transition-all cursor-pointer hover:border-muted-foreground/50 hover:text-muted-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add timeframe"
              {...props}
            >
              +
            </button>
          ) : null}
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

export default Timeframes;
