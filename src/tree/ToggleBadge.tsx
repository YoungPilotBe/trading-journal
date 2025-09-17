import { clsx } from "clsx";
import { useEffect, useState } from "react";

interface SimplifiedToggleBadgeProps {
  value: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
  readonly?: boolean;
  badgeStyle?: string;
}

export const ToggleBadge = ({
  value,
  onChange,
  label,
  disabled = false,
  readonly = false,
  badgeStyle = "border-muted text-muted-foreground",
}: SimplifiedToggleBadgeProps) => {
  const [isToggled, setIsToggled] = useState<boolean>(Boolean(value));

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
          // Custom badgeStyle overrides
          isToggled && badgeStyle
        )}
      >
        {label}
      </button>
    </div>
  );
};
