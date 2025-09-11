import { WidgetProps } from "@rjsf/utils";
import { clsx } from "clsx";
import { useEffect, useState } from "react";

interface ToggleBadgeOptions {
  badgeStyle?: string;
  indent?: number;
}

export const ToggleBadge = (props: WidgetProps) => {
  const { value, onChange, label, options, disabled, readonly } = props;
  const { badgeStyle = "border-muted text-muted-foreground" } =
    (options as ToggleBadgeOptions) || {};

  const [isToggled, setIsToggled] = useState<boolean>(Boolean(value));

  useEffect(() => {
    setIsToggled(Boolean(value));
  }, [value]);

  const handleToggle = () => {
    if (disabled || readonly) return;

    const newValue = !isToggled;
    setIsToggled(newValue);
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
          "px-2 py-0.5 border font-mono text-xs rounded-sm transition-all",
          // State-based styles
          {
            // Base toggled style (slightly lighter than muted) - always applied when toggled
            "border-muted-foreground text-white bg-background": isToggled,
            // Untoggled style
            "border-muted text-muted-foreground hover:border-muted-foreground/50":
              !isToggled,
            // Disabled/readonly state
            "opacity-50 cursor-not-allowed": disabled || readonly,
            // Interactive cursor
            "cursor-pointer": !disabled && !readonly,
          },
          // Custom badgeStyle overrides (applied last to override base toggled style)
          isToggled && badgeStyle
        )}
      >
        {label}
      </button>
    </div>
  );
};
