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
import { statusOptions } from "@/config/constants";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface StatusChangeConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: string;
  newStatus: string;
  onRevert: () => void;
  onContinue: () => void;
}

export function StatusChangeConfirmationDialog({
  open,
  onOpenChange,
  currentStatus,
  newStatus,
  onRevert,
  onContinue,
}: StatusChangeConfirmationDialogProps) {
  const currentStatusOption = statusOptions.find(
    (option) => option.value === currentStatus
  );
  const newStatusOption = statusOptions.find(
    (option) => option.value === newStatus
  );

  const handleRevert = () => {
    onRevert();
    onOpenChange(false);
  };

  const handleContinue = () => {
    onContinue();
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
                Status Change Warning
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                This action will delete existing tags.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded-lg border border-muted bg-muted/20 p-4">
            <div className="space-y-3">
              <div className="font-medium text-sm">Status Change:</div>
              <div className="flex items-center gap-3">
                {/* Current Status Badge */}
                <div
                  className={`px-2 py-1 border font-mono text-xs rounded-sm ${currentStatusOption?.color || "border-muted text-muted-foreground"}`}
                >
                  {currentStatusOption?.label || currentStatus}
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground" />

                {/* New Status Badge */}
                <div
                  className={`px-2 py-1 border font-mono text-xs rounded-sm ${newStatusOption?.color || "border-muted text-muted-foreground"}`}
                >
                  {newStatusOption?.label || newStatus}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="space-y-2">
              <div className="font-medium text-sm text-destructive">
                Warning: Tag Deletion
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  All existing tags associated with this snapshot will be
                  permanently deleted.
                </p>
                <p>
                  Tags are status-specific and cannot be transferred between
                  different statuses.
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            You will need to re-tag this snapshot with appropriate tags for the
            new status.
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={handleRevert}>
            Revert Status
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleContinue}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Continue & Delete Tags
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
