import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useFormState } from "react-hook-form";
import { TPSLFormData, TPSLFormInput } from "../schemas/tpsl-schema";
import { calculateRMultiple } from "../utils";

interface TPSLOverviewProps {
  data?: TPSLFormInput | TPSLFormData;
  onEdit: () => void;
  direction?: "long" | "short";
}

export function TPSLOverview({ data, onEdit, direction }: TPSLOverviewProps) {
  // Get form errors for tpsl field
  const { errors } = useFormState();
  const tpslError = errors.tpsl;
  const hasError = !!tpslError;

  // Extract error message(s) from the error object
  const getErrorMessage = (): string => {
    if (!tpslError) return "";

    // Handle nested error structure (from Zod validation)
    if (typeof tpslError === "object") {
      // Check for root-level message
      if ("message" in tpslError && typeof tpslError.message === "string") {
        return tpslError.message;
      }
      // Check for nested errors (e.g., takeProfits, stopLosses)
      if ("takeProfits" in tpslError) {
        const tpError = tpslError.takeProfits;
        if (tpError && typeof tpError === "object" && "message" in tpError) {
          return String(tpError.message);
        }
      }
      if ("stopLosses" in tpslError) {
        const slError = tpslError.stopLosses;
        if (slError && typeof slError === "object" && "message" in slError) {
          return String(slError.message);
        }
      }
    }

    return "TP/SL validation error";
  };

  const errorMessage = getErrorMessage();

  // Filter entries with valid price and margin > 0
  const validTPs =
    data?.takeProfits.filter(
      (tp) => tp.price !== undefined && tp.price > 0 && tp.margin > 0
    ) || [];
  const validSLs =
    data?.stopLosses.filter(
      (sl) => sl.price !== undefined && sl.price > 0 && sl.margin > 0
    ) || [];

  // Show subtle button if no data or no valid entries
  if (!data || (validTPs.length === 0 && validSLs.length === 0)) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50"
      >
        <Plus className="h-4 w-4 mr-2" />
        Configure TP/SL
      </Button>
    );
  }

  // Calculate R-multiple if we have all required data
  const rMultiple =
    direction && data?.entryPrice
      ? calculateRMultiple(
          data.entryPrice,
          data.takeProfits || [],
          data.stopLosses || [],
          direction
        )
      : undefined;

  const content = (
    <div
      className={cn(
        "p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
        hasError && "border-destructive"
      )}
      onClick={onEdit}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2 text-xs flex-1">
          {data?.entryPrice !== undefined && data.entryPrice > 0 && (
            <div>
              <div className="font-medium text-muted-foreground mb-1">
                Entry Price
              </div>
              <div className="ml-2 text-muted-foreground">
                {data.entryPrice.toFixed(3)}
              </div>
            </div>
          )}
          {validTPs.length > 0 && (
            <div>
              <div className="font-medium text-muted-foreground mb-1">
                Take Profits: {validTPs.length}{" "}
                {validTPs.length === 1 ? "entry" : "entries"}
              </div>
              <div className="ml-2 space-y-0.5">
                {validTPs.map((tp, idx) => (
                  <div key={idx} className="text-muted-foreground">
                    {tp.price?.toFixed(3)} @ {tp.margin}%
                  </div>
                ))}
              </div>
            </div>
          )}
          {validSLs.length > 0 && (
            <div>
              <div className="font-medium text-muted-foreground mb-1">
                Stop Losses: {validSLs.length}{" "}
                {validSLs.length === 1 ? "entry" : "entries"}
              </div>
              <div className="ml-2 space-y-0.5">
                {validSLs.map((sl, idx) => (
                  <div key={idx} className="text-muted-foreground">
                    {sl.price?.toFixed(3)} @ {sl.margin}%
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {rMultiple !== undefined && (
          <div className="text-xs text-muted-foreground text-right">
            <div className="font-medium mb-1">R-Multiple</div>
            <div className="font-mono">{rMultiple.toFixed(2)}R</div>
          </div>
        )}
      </div>
    </div>
  );

  // Wrap in Tooltip if there's an error
  if (hasError && errorMessage) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <p className="text-xs text-destructive">{errorMessage}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
