import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFormState } from "react-hook-form";
import { TPSLFormData } from "../schemas/tpsl-schema";

interface TPSLOverviewProps {
  data?: TPSLFormData;
  onEdit: () => void;
}

export function TPSLOverview({ data, onEdit }: TPSLOverviewProps) {
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

  // Don't render if no data
  if (!data) {
    return null;
  }

  // Filter entries with valid price and margin > 0
  const validTPs = data.takeProfits.filter(
    (tp) => tp.price !== undefined && tp.price > 0 && tp.margin > 0
  );
  const validSLs = data.stopLosses.filter(
    (sl) => sl.price !== undefined && sl.price > 0 && sl.margin > 0
  );

  // Don't render if no valid entries
  if (validTPs.length === 0 && validSLs.length === 0) {
    return null;
  }

  const content = (
    <div
      className={cn(
        "p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
        hasError && "border-destructive"
      )}
      onClick={onEdit}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">TP/SL Configured</h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="h-6 text-xs"
        >
          Edit
        </Button>
      </div>
      <div className="space-y-2 text-xs">
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
