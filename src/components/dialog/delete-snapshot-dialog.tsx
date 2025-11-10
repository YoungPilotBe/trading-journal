import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteSnapshot } from "@/hooks/snapshots/use-delete-snapshot";
import { useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { AlertTriangle } from "lucide-react";

interface DeleteSnapshotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshotId: Id<"snapshots">;
  onSuccess?: (previousSnapshotId: Id<"snapshots">) => void; // Optional callback with previous snapshot ID (always defined on success)
}

export function DeleteSnapshotDialog({
  open,
  onOpenChange,
  snapshotId,
  onSuccess,
}: DeleteSnapshotDialogProps) {
  const navigate = useNavigate();
  const { mutateAsync: deleteSnapshot, isPending: isDeleting } =
    useDeleteSnapshot({
      onSuccess: ({ previousSnapshotId, tradeSetupId }) => {
        // Navigate to the previous snapshot
        navigate({
          from: "/dashboard/setup",
          search: {
            snapshotId: previousSnapshotId,
            tradeSetupId: tradeSetupId,
          },
          to: "/dashboard/setup",
        });
      },
    });

  const handleDelete = async () => {
    try {
      const result = await deleteSnapshot({ snapshotId });
      onOpenChange(false); // Close dialog on success
      onSuccess?.(result.previousSnapshotId); // Call optional success callback with previous snapshot ID
    } catch (error) {
      // Error handling could be added here (toast, etc.)
      console.error("Failed to delete snapshot:", error);
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
              <DialogTitle className="text-left">Delete Snapshot</DialogTitle>
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
                You are about to delete this snapshot
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-muted bg-muted/20 p-4">
            <div className="space-y-2">
              <div className="font-medium text-sm">
                This will permanently remove:
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span>The snapshot image</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span>All annotations and notes</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span>Snapshot metadata</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            This action cannot be undone. The snapshot will be permanently
            removed from the system.
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
            {isDeleting ? "Deleting..." : "Delete Snapshot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
