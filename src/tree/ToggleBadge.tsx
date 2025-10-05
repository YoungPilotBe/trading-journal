import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFieldEffect, useTreeToggle } from "@/tree/TreeContext";
import { findNodeByKeyArray } from "@/tree/tree.utils";
import { clsx } from "clsx";
import { ChevronRight, LucideIcon, Settings } from "lucide-react";
import { TREE_ICON_BASE_CLASS } from "./tree.constants";

interface SimplifiedToggleBadgeProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onChange" | "onClick"
  > {
  label: string;
  badgeStyle?: string;
  fieldName: string;
  icon?: LucideIcon;
  iconClassName?: string;
  isDir?: boolean;
  isBranch?: boolean;
  description?: string;
  imageUrl?: string;
  imageClassName?: string;
}

export const ToggleBadge = ({
  label,
  badgeStyle = "border-muted text-muted-foreground",
  fieldName,
  icon,
  iconClassName = "",
  isDir = false,
  isBranch = false,
  description,
  imageUrl,
  imageClassName = "",
  ...buttonProps
}: SimplifiedToggleBadgeProps) => {
  const effect = useFieldEffect(fieldName);
  const { toggleNode, strategy, treeState } = useTreeToggle();

  // Get current state from context
  const node = findNodeByKeyArray(strategy, fieldName);
  const hasAntiSelection = Boolean(node?.anti?.length);
  const isSelected = treeState.selectedNodes.has(fieldName);
  const isExpanded = treeState.expandedKeys.has(fieldName);

  // Determine the actual toggle state based on node type
  const isToggled = isBranch
    ? hasAntiSelection
      ? isSelected
      : isExpanded
    : isSelected;

  const handleToggle = () => {
    if (buttonProps.disabled) return;
    toggleNode(fieldName, isBranch, hasAntiSelection);
  };

  // Render the Lucide icon if provided
  const renderIcon = () => {
    if (!icon) return null;

    const IconComponent = icon;
    return (
      <IconComponent className={clsx(TREE_ICON_BASE_CLASS, iconClassName)} />
    );
  };

  const buttonElement = (
    <button
      type="button"
      onClick={handleToggle}
      {...buttonProps}
      className={clsx(
        // Base styles matching button badge variant - fixed dimensions
        isDir
          ? "ml-auto w-fit h-fit px-1 py-0.5 gap-2 rounded-sm text-xs font-thin border duration-200 flex items-center justify-end flex-shrink-0"
          : "w-full h-fit px-1 py-0.5 gap-2 rounded-sm text-xs font-thin border duration-200 flex items-center justify-center flex-shrink-0",
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
          "opacity-50 cursor-not-allowed": buttonProps.disabled,
          // Interactive cursor
          "cursor-pointer": !buttonProps.disabled,
        },
        // Custom badgeStyle overrides
        isToggled && badgeStyle,
        buttonProps.className
      )}
    >
      {isDir ? (
        // Directory style - just arrow on the right
        <>
          <Settings className={clsx(TREE_ICON_BASE_CLASS)} />
          <ChevronRight className={clsx(TREE_ICON_BASE_CLASS)} />
        </>
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

  // If there's a description or image, wrap with tooltip
  if (description || imageUrl) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
        <TooltipContent
          side="right"
          className="max-w-sm w-80 p-0 overflow-hidden border-2"
          sideOffset={5}
        >
          <div className="flex flex-col">
            {/* Image Section */}
            {imageUrl && (
              <div className="relative h-48 w-full bg-muted/20">
                <img
                  src={imageUrl}
                  alt={label}
                  className={clsx(
                    "object-contain absolute inset-0 w-full h-full p-2",
                    imageClassName
                  )}
                />
              </div>
            )}

            {/* Description Section */}
            {description && (
              <div className="p-3">
                <p className="text-xs font-mono text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonElement;
};
