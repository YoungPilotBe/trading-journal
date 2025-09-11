import { WidgetProps } from "@rjsf/utils";
import { clsx } from "clsx";
import { useEffect, useState } from "react";

interface RadioToggleBadgeOptions {
  badgeStyle?: string;
  indent?: number;
}

export const RadioToggleBadge = (props: WidgetProps) => {
  const { value, onChange, options, disabled, readonly, schema } = props;
  const { badgeStyle = "border-muted text-muted-foreground" } =
    (options as RadioToggleBadgeOptions) || {};

  const [selectedValue, setSelectedValue] = useState<string | undefined>(value);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleToggle = (optionValue: string) => {
    if (disabled || readonly) return;

    // If clicking the same option, deselect it (set to undefined)
    // If clicking a different option, select it
    const newValue = selectedValue === optionValue ? undefined : optionValue;
    setSelectedValue(newValue);
    onChange(newValue);
  };

  // Get the enum options from the schema
  const enumOptions = schema.enum || [];
  const enumTitles = schema.enumNames || enumOptions;

  return (
    <div className="flex flex-col gap-1">
      {enumOptions.map((optionValue: string, index: number) => {
        const isSelected = selectedValue === optionValue;
        const optionLabel = enumTitles[index] || optionValue;

        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => handleToggle(optionValue)}
            disabled={disabled || readonly}
            className={clsx(
              // Base styles (always applied)
              "w-full px-2 py-0.5 border font-mono text-xs rounded-sm transition-all",
              // State-based styles
              {
                // Selected style
                "border-muted-foreground text-white bg-background": isSelected,
                // Unselected style
                "border-muted text-muted-foreground hover:border-muted-foreground/50":
                  !isSelected,
                // Disabled/readonly state
                "opacity-50 cursor-not-allowed": disabled || readonly,
                // Interactive cursor
                "cursor-pointer": !disabled && !readonly,
              },
              // Custom badgeStyle overrides (applied last to override base selected style)
              isSelected && badgeStyle
            )}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
};
