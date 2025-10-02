import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ControllerRenderProps, useFormState } from "react-hook-form";
import { AddTradeSetupSchema } from "../schemas/add-trade-schema";

type Props = {
  field: ControllerRenderProps<AddTradeSetupSchema, "direction">;
  label: string;
  disabled?: boolean;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "onClick" | "onBlur" | "name" | "id"
>;

const directionOptions = [
  {
    value: "long" as const,
    label: "Long",
    color: "border-green-400/70 bg-green-500/5 text-green-300/80",
  },
  {
    value: "short" as const,
    label: "Short",
    color: "border-red-400/70 bg-red-500/5 text-red-300/80",
  },
];

const Direction = ({ field, label, disabled, ...props }: Props) => {
  const { errors } = useFormState({ name: field.name });
  const error = errors[field.name]?.message;
  const hasError = !!error;

  return (
    <div className="grid grid-cols-[30%_1fr_2.25rem] items-center font-mono">
      <label className="text-xs text-muted" htmlFor={field.name}>
        {label}
      </label>
      <div className="flex justify-end">
        <div className="flex flex-row gap-1.5 items-center max-w-full overflow-hidden">
          {directionOptions.map((option) => {
            const isSelected = field.value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => field.onChange(option.value)}
                disabled={disabled}
                className={`px-0.5 py-0.5 border font-mono text-xs rounded-sm transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? option.color
                    : "border-muted text-muted-foreground hover:border-muted-foreground/50"
                }`}
                {...props}
              >
                {option.label}
              </button>
            );
          })}
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

export default Direction;
