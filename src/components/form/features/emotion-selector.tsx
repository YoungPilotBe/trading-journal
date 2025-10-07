import IEmotionOptions from "@/components/emotion-options";
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
  onEmotionChange?: (emotion: Doc<"snapshots">["emotion"]) => void;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "onClick" | "onBlur" | "name" | "id"
>;

const EmotionOptions = <T extends FieldValues>({
  field,
  label,
  onEmotionChange,
  ...props
}: Props<T>) => {
  const { errors } = useFormState({ name: field.name });
  const error = errors[field.name]?.message;
  const hasError = !!error;

  const handleClick = (emotion: Doc<"snapshots">["emotion"]) => {
    if (onEmotionChange) {
      onEmotionChange(emotion);
    } else {
      field.onChange(emotion);
    }
  };

  const content = (
    <IEmotionOptions selected={field.value} onClick={handleClick} {...props} />
  );

  // If no label, return just the emotion options
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
          <div className="w-2 h-2" />
        )}
      </div>
    </div>
  );
};

export default EmotionOptions;
