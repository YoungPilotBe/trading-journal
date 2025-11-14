import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Timeframe } from "@/config/timeframe-order";
import { AlertTriangle, Clock, Layers } from "lucide-react";

interface RemoveTimeframeConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeframe: Timeframe;
  affectedSnapshotsCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RemoveTimeframeConfirmationDialog({
  open,
  onOpenChange,
  timeframe,
  affectedSnapshotsCount,
  onCancel,
  onConfirm,
}: RemoveTimeframeConfirmationDialogProps) {
  const handleCancel = () => {
    onCancel();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle className="text-left">
                Remove Timeframe from Trade Setup
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                This will affect multiple snapshots.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded-lg border border-muted bg-muted/20 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="font-medium text-sm">Timeframe to Remove:</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-2 py-1 border border-sky-400 text-sky-400 font-mono text-xs rounded-sm">
                  {timeframe}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-destructive" />
                <div className="font-medium text-sm text-destructive">
                  Warning: Multiple Snapshots Affected
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  This timeframe exists in{" "}
                  <span className="font-semibold text-foreground">
                    {affectedSnapshotsCount}{" "}
                    {affectedSnapshotsCount === 1 ? "snapshot" : "snapshots"}
                  </span>{" "}
                  of this trade setup.
                </p>
                <p>
                  Removing it will delete this timeframe from{" "}
                  <span className="font-semibold text-foreground">
                    all affected snapshots
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            This action cannot be undone. Consider if this timeframe should be
            removed from the entire trade setup.
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Remove from All Snapshots
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

