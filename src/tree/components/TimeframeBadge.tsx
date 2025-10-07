import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Clock, type LucideIcon } from "lucide-react";
import {
  useTreeActions,
  useTreeManagers,
  useTreeStateValue,
} from "../TreeContext.new";
import { TREE_ICON_BASE_CLASS } from "../tree.constants";
import { FRACTAL_ICON, SWING_ICON } from "./icons";

// Constants for timeframe analysis types
const SWING_NODE_KEY = "swing";
const FRACTAL_NODE_KEY = "fractal";

const timeframeBadgeVariants = cva(
  // Base styles - matching ToggleBadge
  "px-1 py-0.5 gap-2 rounded-sm text-xs font-thin border duration-200 flex items-center flex-shrink-0",
  {
    variants: {
      layout: {
        normal: "w-full justify-center text-center line-clamp-2 leading-tight",
      },
      state: {
        active:
          "bg-primary/20 border-primary text-primary shadow-md font-semibold",
        inactive:
          "bg-gradient-to-t from-muted/20 to-muted/10 border-muted/50 text-muted-foreground hover:from-muted hover:to-accent cursor-pointer",
        disabled: "opacity-50 cursor-not-allowed",
      },
    },
    defaultVariants: {
      layout: "normal",
      state: "inactive",
    },
  }
);

interface TimeframeBadgeProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      "onChange" | "onClick"
    >,
    VariantProps<typeof timeframeBadgeVariants> {
  label: string;
  fieldName: string;
  badgeStyle?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  description?: string;
  imageUrl?: string;
  imageClassName?: string;
  isBranch?: boolean;
}

export const TimeframeBadge = ({
  label,
  fieldName,
  badgeStyle = "border-muted text-muted-foreground",
  icon,
  iconClassName = "",
  description,
  imageUrl,
  imageClassName = "",
  isBranch = true,
  className,
  ...buttonProps
}: TimeframeBadgeProps) => {
  // Get context values using hooks
  const { trees, treeState: treeStateManager } = useTreeManagers();
  const treeState = useTreeStateValue();
  const { toggleNode } = useTreeActions();

  // Find the node in the tree using TreeNode class methods
  const node = trees
    .find((tree) => tree.findNode(fieldName))
    ?.findNode(fieldName);
  const hasAntiSelection = Boolean(node?.antiKeys.length);
  const isSelected = treeState.selectedNodes.has(fieldName);
  const isExpanded = treeState.expandedKeys.has(fieldName);

  // Determine the actual toggle state based on node type
  const isToggled = isBranch
    ? hasAntiSelection
      ? isSelected
      : isExpanded
    : isSelected;

  // Check if this timeframe badge is a direct child of a swing or fractal node
  const isDirectChildOfSwingOrFractal =
    node?.parent?.key.includes(SWING_NODE_KEY) ||
    node?.parent?.key.includes(FRACTAL_NODE_KEY);

  // Get selected timeframes for each analysis type from TreeState
  const swingTimeframes =
    treeStateManager.getSelectedTimeframesForNodeType(SWING_NODE_KEY);
  const fractalTimeframes =
    treeStateManager.getSelectedTimeframesForNodeType(FRACTAL_NODE_KEY);

  // Check if this timeframe is in the selected lists
  // But exclude if this badge itself is a direct child of those nodes
  const isSwingTimeframeSelected =
    !isDirectChildOfSwingOrFractal && swingTimeframes.includes(label);
  const isFractalTimeframeSelected =
    !isDirectChildOfSwingOrFractal && fractalTimeframes.includes(label);

  const handleToggle = () => {
    if (buttonProps.disabled) return;
    toggleNode(fieldName, isBranch, hasAntiSelection);
  };

  // Render the Lucide icon if provided
  const renderIcon = () => {
    if (!icon)
      return (
        <Clock
          className={cn(TREE_ICON_BASE_CLASS, iconClassName, "text-violet-400")}
        />
      );

    const IconComponent = icon;
    return (
      <IconComponent className={cn(TREE_ICON_BASE_CLASS, iconClassName)} />
    );
  };

  const badgeElement = (
    <button
      type="button"
      onClick={handleToggle}
      {...buttonProps}
      className={timeframeBadgeVariants({
        layout: "normal",
        state: buttonProps.disabled
          ? "disabled"
          : isToggled
            ? "active"
            : "inactive",
        className: cn(
          // Custom badgeStyle overrides
          isToggled && badgeStyle,

          className
        ),
      })}
    >
      <span className="flex flex-row items-center justify-between gap-1 font-mono min-w-0">
        <div className="flex flex-row items-center gap-1 min-w-0 flex-1">
          {renderIcon()}
          <span className="truncate">{label}</span>
        </div>
        {isSwingTimeframeSelected && SWING_ICON}
        {isFractalTimeframeSelected && FRACTAL_ICON}
      </span>
    </button>
  );

  // If there's a description or image, wrap with tooltip
  if (description || imageUrl) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badgeElement}</TooltipTrigger>
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
                  className={cn(
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

  return badgeElement;
};
