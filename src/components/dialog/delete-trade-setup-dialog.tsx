import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetSnapshotByTradeSetupId } from "@/hooks/snapshots/use-get-snapshot-by-trade-setup";
import { useDeleteTradeSetup } from "@/hooks/trade-setup/use-delete-trade-setup";
import { useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { AlertTriangle } from "lucide-react";

interface DeleteTradeSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tradeSetupId: Id<"trade_setups">;
  tradeSetupTitle: string;
  onSuccess?: () => void; // Optional callback for when deletion succeeds
}

export function DeleteTradeSetupDialog({
  open,
  onOpenChange,
  tradeSetupId,
  tradeSetupTitle,
  onSuccess,
}: DeleteTradeSetupDialogProps) {
  const navigate = useNavigate();

  const { data: snapshots } = useGetSnapshotByTradeSetupId({
    tradeSetupId,
    sortBy: "createdAt",
    sortOrder: "asc",
  });

  const { mutateAsync: deleteTradeSetup, isPending: isDeleting } =
    useDeleteTradeSetup({
      onSuccess: () => {
        navigate({
          from: "/dashboard",
          to: "/dashboard",
        });
      },
    });

  const snapshotCount = snapshots?.length || 0;

  const handleDelete = async () => {
    try {
      await deleteTradeSetup({ tradeSetupId });
      onOpenChange(false); // Close dialog on success
      onSuccess?.(); // Call optional success callback
    } catch (error) {
      // Error handling could be added here (toast, etc.)
      console.error("Failed to delete trade setup:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-left">
                Delete Trade Setup
              </DialogTitle>
              <DialogDescription className="text-left">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="space-y-2">
              <div className="font-medium text-sm">
                You are about to delete:
              </div>
              <div className="font-mono text-sm text-muted-foreground">
                "{tradeSetupTitle}"
              </div>
            </div>
          </div>

          {snapshotCount > 0 && (
            <div className="rounded-lg border border-muted bg-muted/20 p-4">
              <div className="space-y-2">
                <div className="font-medium text-sm">
                  This will also delete:
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="font-mono">
                    {snapshotCount} snapshot{snapshotCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            All associated data will be permanently removed from the system.
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Trade Setup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
