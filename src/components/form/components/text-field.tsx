import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import clsx from "clsx";
import React from "react";
import { useFormState } from "react-hook-form";

type Props = {
  label:
    | string
    | {
        value: string;
        className: string;
      };
} & React.InputHTMLAttributes<HTMLInputElement>;

const TextField = React.forwardRef<HTMLInputElement, Props>(
  ({ label, name, className, ...props }, ref) => {
    const { errors } = useFormState({ name });
    const error = name ? errors[name]?.message : undefined;
    const hasError = !!error;

    return (
      <div className="grid grid-cols-[30%_1fr_2.25rem] items-center font-mono ">
        <label
          className={clsx(
            "font-mono text-xs text-muted",
            typeof label === "object" && label.className
          )}
          htmlFor={name}
        >
          {typeof label === "string" ? label : label.value}
        </label>
        <div className="flex justify-end pr-2">
          <input
            ref={ref}
            id={name}
            name={name}
            className={clsx(
              "text-emerald-500 placeholder:text-emerald-500/60 border-none !bg-transparent !font-mono !text-xs text-end !p-0 w-fit !outline-0 !ring-0 focus-visible:underline !m-0",
              className
            )}
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
  }
);

TextField.displayName = "TextField";

export default TextField;
