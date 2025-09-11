import { WidgetProps } from "@rjsf/utils";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { useFieldEffect } from "../EffectsContext";

interface ToggleBadgeOptions {
  badgeStyle?: string;
  indent?: number;
  conflictingField?: string; // The field that should be set to false when this one is set to true
}

export const ToggleBadge = (props: WidgetProps) => {
  const {
    value,
    onChange,
    label,
    options,
    disabled,
    readonly,
    formContext,
    name,
  } = props;
  const {
    badgeStyle = "border-muted text-muted-foreground",
    conflictingField,
  } = (options as ToggleBadgeOptions) || {};

  const [isToggled, setIsToggled] = useState<boolean>(Boolean(value));

  // Get effect based on the current toggle state
  const effect = useFieldEffect(name, label);

  useEffect(() => {
    setIsToggled(Boolean(value));
  }, [value]);

  const handleToggle = () => {
    if (disabled || readonly) return;

    const newValue = !isToggled;
    setIsToggled(newValue);

    // If we're turning this field ON and there's a conflicting field, turn the conflicting field OFF
    if (newValue && conflictingField && formContext) {
      // Access the root form's onChange through formContext
      if (formContext.formData && formContext.onChange) {
        const updatedFormData = { ...formContext.formData };
        updatedFormData[conflictingField] = false;

        // Update the entire form data to trigger re-render of the conflicting field
        formContext.onChange(updatedFormData);
      }
    }

    onChange(newValue);
  };

  // Calculate margin based on indent level

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || readonly}
        className={clsx(
          // Base styles (always applied)
          "w-full px-2 py-0.5 border font-mono text-xs rounded-sm transition-all flex items-center justify-center gap-2",
          // State-based styles
          {
            // Base toggled style (slightly lighter than muted) - always applied when toggled
            "border-muted-foreground text-white bg-background": isToggled,
            "border-muted text-muted-foreground hover:border-muted-foreground/50":
              !isToggled,
            // Disabled/readonly state
            "opacity-50 cursor-not-allowed": disabled || readonly,
            // Interactive cursor
            "cursor-pointer": !disabled && !readonly,
          },
          // Custom badgeStyle overrides (applied last to override effect styles if provided)
          isToggled && badgeStyle && !effect
        )}
      >
        {label}
        <div
          className={clsx("rounded-full size-1 hidden", {
            "bg-sky-500 !block": effect === "positive",
            "bg-rose-500 !block": effect === "negative",
          })}
        />
      </button>
    </div>
  );
};
