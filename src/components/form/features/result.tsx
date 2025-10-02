import ResultBadge from "@/components/result-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ControllerRenderProps, useFormState } from "react-hook-form";
import { AddTradeSetupSchema } from "../schemas/add-trade-schema";

type Props = {
  field: ControllerRenderProps<AddTradeSetupSchema, "result">;
  label: string;
  disabled?: boolean;
  existingResult?: "win" | "loss" | "breakeven" | null;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "onClick" | "onBlur" | "name" | "id"
>;

const resultOptions = [
  {
    value: "win" as const,
    label: "Win",
  },
  {
    value: "loss" as const,
    label: "Loss",
  },
  {
    value: "breakeven" as const,
    label: "Breakeven",
  },
];

export function Result({ field, label, disabled, ...props }: Props) {
  const { errors } = useFormState({ name: field.name });
  const error = errors[field.name]?.message;
  const hasError = !!error;

  return (
    <div className="grid grid-cols-[30%_1fr_2.25rem] items-center h-9 font-mono">
      <label className="text-xs text-muted" htmlFor={field.name}>
        {label}
      </label>
      <div className="flex justify-end">
        <div className="flex flex-row gap-1.5 items-center max-w-full overflow-hidden">
          {resultOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                field.onChange(
                  field.value === option.value ? null : option.value
                )
              }
              disabled={disabled}
              {...props}
            >
              <ResultBadge
                className={`px-1 py-0.5 border font-mono text-xs rounded-sm transition-all cursor-pointer ${
                  field.value !== option.value &&
                  "border-muted text-muted-foreground hover:border-muted-foreground/50 bg-background"
                }`}
                result={option.value}
                size="normal"
              />
            </button>
          ))}
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
}

export default Result;
