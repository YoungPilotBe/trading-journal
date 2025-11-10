import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as React from "react";

import { cn } from "@/lib/utils";

interface SeparatorProps
  extends React.ComponentProps<typeof SeparatorPrimitive.Root> {
  text?: string;
  textPosition?: "left" | "right" | "center";
  textClassName?: string;
}

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  text,
  textPosition = "center",
  textClassName,
  ...props
}: SeparatorProps) {
  // If no text is provided, render the simple separator
  if (!text) {
    return (
      <SeparatorPrimitive.Root
        data-slot="separator"
        decorative={decorative}
        orientation={orientation}
        className={cn(
          "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
          className
        )}
        {...props}
      />
    );
  }

  // Only support horizontal orientation with text
  if (orientation === "vertical") {
    console.warn("Separator with text only supports horizontal orientation");
    return (
      <SeparatorPrimitive.Root
        data-slot="separator"
        decorative={decorative}
        orientation={orientation}
        className={cn(
          "bg-border shrink-0 data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
          className
        )}
        {...props}
      />
    );
  }

  // Render separator with text
  return (
    <div className={cn("flex items-center w-full", className)} {...props}>
      {textPosition === "left" && (
        <small
          className={cn(
            "text-muted-foreground font-mono px-2 shrink-0",
            textClassName
          )}
        >
          {text}
        </small>
      )}

      {(textPosition === "left" || textPosition === "center") && (
        <SeparatorPrimitive.Root
          data-slot="separator"
          decorative={decorative}
          orientation="horizontal"
          className="bg-border h-px flex-1"
        />
      )}

      {textPosition === "center" && (
        <small
          className={cn(
            "text-muted-foreground font-mono px-3 shrink-0",
            textClassName
          )}
        >
          {text}
        </small>
      )}

      {(textPosition === "center" || textPosition === "right") && (
        <SeparatorPrimitive.Root
          data-slot="separator"
          decorative={decorative}
          orientation="horizontal"
          className="bg-border h-px flex-1"
        />
      )}

      {textPosition === "right" && (
        <small
          className={cn(
            "text-muted-foreground font-mono px-2 shrink-0",
            textClassName
          )}
        >
          {text}
        </small>
      )}
    </div>
  );
}

export { Separator };
