import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronRight, type LucideIcon, Settings } from "lucide-react";
import {
  useFieldEffect,
  useTreeActions,
  useTreeManagers,
  useTreeStateValue,
} from "../TreeContext.new";
import { TREE_ICON_BASE_CLASS } from "../tree.constants";

const toggleBadgeVariants = cva(
  // Base styles
  "px-1 py-0.5 gap-2 rounded-sm text-xs font-thin border duration-200 flex items-center flex-shrink-0",
  {
    variants: {
      layout: {
        dir: "ml-auto w-fit justify-end",
        normal: "w-full justify-center text-center line-clamp-2 leading-tight",
      },
      variant: {
        default: "",
        confirmation: "",
      },
      state: {
        toggled: "",
        untoggled: "",
        disabled: "opacity-50 cursor-not-allowed",
      },
    },
    compoundVariants: [
      // Default variant - toggled
      {
        variant: "default",
        state: "toggled",
        class:
          "bg-primary/20 border-primary text-primary shadow-md font-semibold",
      },
      // Default variant - untoggled
      {
        variant: "default",
        state: "untoggled",
        class:
          "bg-gradient-to-t from-muted/20 to-muted/10 border-muted/50 text-muted-foreground hover:from-muted hover:to-accent cursor-pointer",
      },
      // Confirmation variant - toggled
      {
        variant: "confirmation",
        state: "toggled",
        class:
          "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md font-semibold",
      },
      // Confirmation variant - untoggled
      {
        variant: "confirmation",
        state: "untoggled",
        class:
          "bg-emerald-500/20 border-emerald-500 text-emerald-700 shadow-md font-semibold opacity-50",
      },
    ],
    defaultVariants: {
      layout: "normal",
      variant: "default",
      state: "untoggled",
    },
  }
);

interface SimplifiedToggleBadgeProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      "onChange" | "onClick"
    >,
    VariantProps<typeof toggleBadgeVariants> {
  label: string;
  badgeStyle?: string;
  fieldName: string;
  icon?: LucideIcon;
  iconClassName?: string;
  isDir?: boolean;
  isConfirmation?: boolean;
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
  isConfirmation = false,
  isBranch = false,
  description,
  imageUrl,
  imageClassName = "",
  className,
  ...buttonProps
}: SimplifiedToggleBadgeProps) => {
  // Get context values using new hooks
  const effect = useFieldEffect(fieldName);
  const { trees } = useTreeManagers();
  const treeState = useTreeStateValue();
  const { toggleNode } = useTreeActions();

  // Find the node in the tree using TreeNode class methods
  const node = trees
    .find((tree) => tree.findNodeByPath(fieldName))
    ?.findNodeByPath(fieldName);
  const hasAntiSelection = Boolean(node?.antiKeys.length);
  const isSelected = treeState.selectedPaths.has(fieldName);
  const isExpanded = treeState.expandedPaths.has(fieldName);

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
      <IconComponent className={cn(TREE_ICON_BASE_CLASS, iconClassName)} />
    );
  };

  const buttonElement = (
    <button
      type="button"
      onClick={handleToggle}
      {...buttonProps}
      className={toggleBadgeVariants({
        layout: isDir ? "dir" : "normal",
        variant: isConfirmation ? "confirmation" : "default",
        state: buttonProps.disabled
          ? "disabled"
          : isToggled
            ? "toggled"
            : "untoggled",
        className: cn(
          // Custom badgeStyle overrides (only apply if not confirmation variant)
          isToggled && !isConfirmation && badgeStyle,
          className
        ),
      })}
    >
      {isDir ? (
        // Directory style - just arrow on the right
        <>
          <Settings className={cn(TREE_ICON_BASE_CLASS)} />
          <ChevronRight className={cn(TREE_ICON_BASE_CLASS)} />
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
              className={cn("size-1 rounded-full flex-shrink-0", {
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

  return buttonElement;
};
