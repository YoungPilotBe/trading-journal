import TimeframeKeyboard from "@/components/simple-keyboard/timeframe-keyboard";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Timeframe, TIMEFRAMES } from "@/config/timeframe-order";
import { useTimeframeKeyboard } from "@/hooks/use-timeframe-keyboard";
import clsx from "clsx";
import { useRef } from "react";
import {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  useFormState,
} from "react-hook-form";

type Props<T extends FieldValues> = {
  field: ControllerRenderProps<T, FieldPath<T>>;
  label: string;
  disabled?: boolean;
  highlightedTimeframes?: Timeframe[];
  allTimeframes?: Timeframe[]; // All timeframes from all snapshots
  onRemove?: (timeframe: Timeframe, newTimeframes: Timeframe[]) => void;
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

const TimeframesGeneric = <T extends FieldValues>({
  field,
  label,
  highlightedTimeframes = [],
  allTimeframes,
  disabled,
  onRemove,
  ...props
}: Props<T>) => {
  const { errors } = useFormState({ name: field.name });
  const error = errors[field.name]?.message;
  const hasError = !!error;

  const { isOpen, openKeyboard, closeKeyboard } = useTimeframeKeyboard();
  const addButtonRef = useRef<HTMLButtonElement>(null);

  // Current snapshot's timeframes (field value)
  const currentTimeframes: string[] = Array.isArray(field.value)
    ? field.value
    : [];

  // Display all timeframes merged with current field value
  // This ensures newly added timeframes show up immediately before form submission
  // Also filters out timeframes that were removed from the current snapshot
  const displayTimeframes = allTimeframes
    ? (() => {
        // Get timeframes from other snapshots (not in highlighted/original)
        const otherSnapshotsTimeframes = allTimeframes.filter(
          (tf) => !highlightedTimeframes.includes(tf)
        );
        // Combine with current snapshot's timeframes (including new additions)
        return [
          ...new Set([...otherSnapshotsTimeframes, ...currentTimeframes]),
        ];
      })()
    : currentTimeframes;

  const handleRemove = (timeframe: string) => {
    const newTimeframes = currentTimeframes.filter((tf) => tf !== timeframe);
    if (onRemove) {
      onRemove(timeframe as Timeframe, newTimeframes as Timeframe[]);
    } else {
      field.onChange(newTimeframes);
    }
  };

  const handleTimeframeSelect = (selectedTimeframe: string) => {
    if (selectedTimeframe === "") {
      // Backspace pressed - do nothing for now
      return;
    }
    // Check if timeframe is valid and not already in the list
    if (
      isValidTimeframe(selectedTimeframe) &&
      !displayTimeframes.includes(selectedTimeframe as Timeframe)
    ) {
      field.onChange([...currentTimeframes, selectedTimeframe]);
    }
  };

  return (
    <div className="grid grid-cols-[30%_1fr_2.25rem] items-center font-mono">
      <label className="text-xs text-muted" htmlFor={field.name}>
        {label}
      </label>
      <div className="flex justify-end">
        <div className="flex flex-row gap-1 items-center max-w-full overflow-hidden">
          {sortTimeframes(displayTimeframes).map((timeframe) => {
            const isHighlighted = highlightedTimeframes.includes(
              timeframe as Timeframe
            );
            // Check if this is a newly added timeframe (not yet in database)
            const isNew = allTimeframes
              ? !allTimeframes.includes(timeframe as Timeframe) &&
                currentTimeframes.includes(timeframe)
              : false;

            return (
              <button
                key={timeframe}
                type="button"
                onClick={() => handleRemove(timeframe)}
                disabled={disabled}
                className={clsx(
                  "px-1 py-0.5 border font-mono text-xs rounded-sm transition-all cursor-pointer hover:border-red-400/50 hover:text-red-400/70 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-muted disabled:hover:text-muted-foreground whitespace-nowrap",
                  isNew
                    ? "border-emerald-500 text-emerald-500"
                    : isHighlighted
                      ? "border-sky-400 text-sky-400"
                      : "border-muted text-muted-foreground"
                )}
                title={isNew ? "Newly added (unsaved)" : "Click to remove"}
                {...props}
              >
                {timeframe}
              </button>
            );
          })}

          {/* Add timeframe button */}
          {!disabled && (
            <button
              ref={addButtonRef}
              type="button"
              onClick={openKeyboard}
              disabled={disabled}
              className="px-1 py-0.5 border border-muted text-muted-foreground font-mono text-xs rounded-sm transition-all cursor-pointer hover:border-muted-foreground/50 hover:text-muted-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add timeframe"
              {...props}
            >
              +
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

      {/* Timeframe Keyboard */}
      <TimeframeKeyboard
        enable={!disabled}
        triggerRef={addButtonRef}
        isOpen={isOpen}
        onClose={closeKeyboard}
        onSelect={handleTimeframeSelect}
        selectedTimeframes={displayTimeframes}
      />
    </div>
  );
};

export default TimeframesGeneric;
