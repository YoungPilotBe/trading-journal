import { Button } from "@/components/ui/button";
import { TPSLFormData } from "../schemas/tpsl-schema";

interface TPSLOverviewProps {
  data?: TPSLFormData;
  onEdit: () => void;
}

export function TPSLOverview({ data, onEdit }: TPSLOverviewProps) {
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

  return (
    <div
      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
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
}
