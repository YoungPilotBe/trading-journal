import { useFieldEffect } from "@/tree/EffectsContext";
import { clsx } from "clsx";
import { ChevronRight, LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { TREE_ICON_BASE_CLASS } from "./tree.constants";

interface SimplifiedToggleBadgeProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onChange" | "onClick" | "value"
  > {
  value: boolean;
  onChange: () => void;
  label: string;
  badgeStyle?: string;
  fieldName: string;
  icon?: LucideIcon;
  iconClassName?: string;
  isDir?: boolean;
  readOnly?: boolean;
}

export const ToggleBadge = ({
  value,
  onChange,
  label,
  badgeStyle = "border-muted text-muted-foreground",
  fieldName,
  icon,
  iconClassName = "",
  isDir = false,
  readOnly = false,
  ...buttonProps
}: SimplifiedToggleBadgeProps) => {
  const [isToggled, setIsToggled] = useState<boolean>(Boolean(value));
  const effect = useFieldEffect(fieldName);

  useEffect(() => {
    setIsToggled(Boolean(value));
  }, [value]);

  const handleToggle = () => {
    if (buttonProps.disabled || readOnly) return;

    const newValue = !isToggled;
    setIsToggled(newValue);
    onChange();
  };

  // Render the Lucide icon if provided
  const renderIcon = () => {
    if (!icon) return null;

    const IconComponent = icon;
    return (
      <IconComponent className={clsx(TREE_ICON_BASE_CLASS, iconClassName)} />
    );
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      {...buttonProps}
      className={clsx(
        // Base styles matching button badge variant - fixed dimensions
        isDir
          ? "ml-auto w-fit h-fit px-1 py-0.5 gap-2 rounded-sm text-xs font-thin border transition-all duration-200 flex items-center justify-end flex-shrink-0"
          : "w-full h-fit px-1 py-0.5 gap-2 rounded-sm text-xs font-thin border transition-all duration-200 flex items-center justify-center flex-shrink-0",
        // Text handling
        !isDir && "text-center line-clamp-2 leading-tight",
        // State-based styles
        {
          // Toggled state - bright and obvious
          "bg-primary/20 border-primary text-primary shadow-md font-semibold":
            isToggled,
          // Non-toggled state - muted version
          "bg-gradient-to-t from-muted/20 to-muted/10 border-muted/50 text-muted-foreground hover:from-muted hover:to-accent":
            !isToggled,
          // Disabled/readonly state
          "opacity-50 cursor-not-allowed": buttonProps.disabled || readOnly,
          // Interactive cursor
          "cursor-pointer": !buttonProps.disabled && !readOnly,
        },
        // Custom badgeStyle overrides
        isToggled && badgeStyle,
        buttonProps.className
      )}
    >
      {isDir ? (
        // Directory style - just arrow on the right
        <ChevronRight className={clsx(TREE_ICON_BASE_CLASS)} />
      ) : (
        // Normal badge style
        <span className="flex flex-row items-center justify-between gap-1 font-mono min-w-0">
          <div className="flex flex-row items-center gap-1 min-w-0 flex-1">
            {renderIcon()}
            <span className="truncate">{label}</span>
          </div>
          {effect && (
            <div
              className={clsx("size-1 rounded-full flex-shrink-0", {
                "bg-sky-500": effect === "positive",
                "bg-red-500": effect === "negative",
              })}
            />
          )}
        </span>
      )}
    </button>
  );
};
