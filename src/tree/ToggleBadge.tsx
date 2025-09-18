import { useFieldEffect } from "@/tree/EffectsContext";
import { clsx } from "clsx";
import { useEffect, useState } from "react";

interface SimplifiedToggleBadgeProps {
  value: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
  readonly?: boolean;
  badgeStyle?: string;
  fieldName: string;
}

export const ToggleBadge = ({
  value,
  onChange,
  label,
  disabled = false,
  readonly = false,
  badgeStyle = "border-muted text-muted-foreground",
  fieldName,
}: SimplifiedToggleBadgeProps) => {
  const [isToggled, setIsToggled] = useState<boolean>(Boolean(value));
  const effect = useFieldEffect(fieldName);

  useEffect(() => {
    setIsToggled(Boolean(value));
  }, [value]);

  const handleToggle = () => {
    if (disabled || readonly) return;

    const newValue = !isToggled;
    setIsToggled(newValue);
    onChange();
  };

  return (
    <div className="w-full h-full">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || readonly}
        className={clsx(
          // Base styles matching button badge variant - fixed dimensions
          "w-full h-fit px-1 py-0.5 gap-2 rounded-sm text-xs font-thin border transition-all duration-200 flex items-center justify-center flex-shrink-0",
          // Text handling
          "text-center line-clamp-2 leading-tight",
          // State-based styles
          {
            // Toggled state - bright and obvious
            "bg-primary/20 border-primary text-primary shadow-md font-semibold":
              isToggled,
            // Non-toggled state - muted version
            "bg-gradient-to-t from-muted/20 to-muted/10 border-muted/50 text-muted-foreground hover:from-muted hover:to-accent":
              !isToggled,
            // Disabled/readonly state
            "opacity-50 cursor-not-allowed": disabled || readonly,
            // Interactive cursor
            "cursor-pointer": !disabled && !readonly,
          },
          // Custom badgeStyle overrides
          isToggled && badgeStyle
        )}
      >
        <span className="flex flex-row items-center justify-between gap-1 font-mono">
          {label}
          {effect && (
            <div
              className={clsx("size-1 rounded-full flex-shrink-0", {
                "bg-sky-500": effect === "positive",
                "bg-red-500": effect === "negative",
              })}
            />
          )}
        </span>
      </button>
    </div>
  );
};
