import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, children, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children);
    const totalChildren = childrenArray.length;

    return (
      <div
        ref={ref}
        className={cn("inline-flex", className)}
        role="group"
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            const isFirst = index === 0;
            const isLast = index === totalChildren - 1;

            return React.cloneElement(child, {
              className: cn(
                child.props.className,
                isFirst && "rounded-r-none border-r-0",
                isLast && "rounded-l-none border-l-0",
                !isFirst && !isLast && "rounded-none border-l-0 border-r-0"
              ),
            });
          }
          return child;
        })}
      </div>
    );
  }
);

ButtonGroup.displayName = "ButtonGroup";

export { ButtonGroup };

