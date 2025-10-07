import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, type LucideIcon } from "lucide-react";
import {
  useTreeActions,
  useTreeManagers,
  useTreeStateValue,
} from "../TreeContext.new";
import { TREE_ICON_BASE_CLASS } from "../tree.constants";

const confirmationBadgeVariants = cva(
  // Base styles - matching ToggleBadge
  "px-1 py-0.5 gap-2 rounded-sm text-xs font-thin border duration-200 flex items-center flex-shrink-0",
  {
    variants: {
      layout: {
        normal: "w-full justify-center text-center line-clamp-2 leading-tight",
      },
      state: {
        toggled:
          "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md font-semibold",
        untoggled:
          "bg-emerald-500/20 border-emerald-500 text-emerald-700 shadow-md font-semibold opacity-50 hover:opacity-100 cursor-pointer",
        disabled: "opacity-50 cursor-not-allowed",
      },
    },
    defaultVariants: {
      layout: "normal",
      state: "untoggled",
    },
  }
);

interface ConfirmationBadgeProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      "onChange" | "onClick"
    >,
    VariantProps<typeof confirmationBadgeVariants> {
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

export const ConfirmationBadge = ({
  label,
  fieldName,
  badgeStyle,
  icon,
  iconClassName = "",
  description,
  imageUrl,
  imageClassName = "",
  isBranch = false,
  className,
  ...buttonProps
}: ConfirmationBadgeProps) => {
  // Get context values using hooks
  const { trees } = useTreeManagers();
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

  const handleToggle = () => {
    if (buttonProps.disabled) return;
    toggleNode(fieldName, isBranch, hasAntiSelection);
  };

  // Render the Lucide icon if provided
  const renderIcon = () => {
    if (!icon)
      return (
        <Check
          className={cn(
            TREE_ICON_BASE_CLASS,
            iconClassName,
            "text-emerald-500"
          )}
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
      className={confirmationBadgeVariants({
        layout: "normal",
        state: buttonProps.disabled
          ? "disabled"
          : isToggled
            ? "toggled"
            : "untoggled",
        className: cn(
          // Custom badgeStyle overrides
          badgeStyle,
          className
        ),
      })}
    >
      <span className="flex flex-row items-center justify-between gap-1 font-mono min-w-0">
        <div className="flex flex-row items-center gap-1 min-w-0 flex-1">
          {renderIcon()}
          <span className="truncate">{label}</span>
        </div>
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
