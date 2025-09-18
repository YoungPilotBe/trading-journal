import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const dualSelectorVariants = cva(
  "inline-flex items-center border  bg-background text-muted-foreground",
  {
    variants: {
      size: {
        default: "h-6",
        sm: "h-5 text-xs",
        lg: "h-7",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const dualSelectorItemVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-xs font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer px-2 py-1",
  {
    variants: {
      variant: {
        default:
          "data-[state=active]:bg-gradient-to-t data-[state=active]:from-background data-[state=active]:to-sidebar data-[state=active]:text-gray-100 data-[state=active]:shadow-sm hover:bg-muted/50",
      },
      position: {
        left: "",
        right: "border-l border-border data-[state=active]:border-border/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface DualSelectorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dualSelectorVariants> {
  value?: string;
  onValueChange?: (value: string) => void;
  leftValue: string;
  rightValue: string;
  leftLabel: React.ReactNode;
  rightLabel: React.ReactNode;
  disabled?: boolean;
}

const DualSelector = React.forwardRef<HTMLDivElement, DualSelectorProps>(
  (
    {
      className,
      size,
      value,
      onValueChange,
      leftValue,
      rightValue,
      leftLabel,
      rightLabel,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleItemClick = (itemValue: string) => {
      if (disabled || value === itemValue) return;
      onValueChange?.(itemValue);
    };

    return (
      <div
        ref={ref}
        className={cn(dualSelectorVariants({ size, className }))}
        {...props}
      >
        <div
          className={cn(
            dualSelectorItemVariants({ position: "left" }),
            disabled && "opacity-50 cursor-not-allowed"
          )}
          data-state={value === leftValue ? "active" : "inactive"}
          onClick={() => handleItemClick(leftValue)}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleItemClick(leftValue);
            }
          }}
        >
          {leftLabel}
        </div>
        <div
          className={cn(
            dualSelectorItemVariants({ position: "right" }),
            disabled && "opacity-50 cursor-not-allowed"
          )}
          data-state={value === rightValue ? "active" : "inactive"}
          onClick={() => handleItemClick(rightValue)}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleItemClick(rightValue);
            }
          }}
        >
          {rightLabel}
        </div>
      </div>
    );
  }
);

DualSelector.displayName = "DualSelector";

export { DualSelector, dualSelectorVariants };
export type { DualSelectorProps };
