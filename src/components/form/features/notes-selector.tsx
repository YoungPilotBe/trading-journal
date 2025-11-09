import { useDialog } from "@/contexts/dialog-context";
import { useGetNotesTradeSetup } from "@/hooks/notes/use-get-notes-trade-setup";
import { Doc, Id } from "convex/_generated/dataModel";
import { FileTextIcon, Loader2 } from "lucide-react";

type Props = {
  disabled?: boolean;
  snapshotId: Id<"snapshots">;
  tradeSetupId: Id<"trade_setups">;
  snapshot?: Doc<"snapshots"> | null;
};

const NotesSelector = ({
  disabled,
  snapshotId,
  tradeSetupId,
  snapshot,
}: Props) => {
  const { openDialog } = useDialog();

  const { data: notes, isLoading: isLoadingNotes } = useGetNotesTradeSetup({
    snapshotId,
  });

  const handleOpenNotesDialog = () => {
    openDialog("NOTES", {
      snapshotId,
      tradeSetupId,
      snapshot,
    });
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled={disabled || isLoadingNotes}
        onClick={handleOpenNotesDialog}
        className={`flex flex-row items-center justify-between gap-2 px-3 py-2 border font-mono text-xs rounded-sm transition-all whitespace-nowrap ${
          disabled || isLoadingNotes
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
        } ${
          notes && notes.length > 0
            ? "border-blue-400/70 bg-blue-500/5 text-blue-300/80"
            : "border-muted text-muted-foreground hover:border-muted-foreground/50"
        }`}
      >
        {isLoadingNotes ? (
          <div className="flex items-center gap-2">
            <Loader2 className="size-3 animate-spin" />
          </div>
        ) : notes && notes.length > 0 ? (
          <div className="flex items-center gap-2">
            <FileTextIcon className="size-3" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <FileTextIcon className="size-3" />
          </div>
        )}
      </button>
      {notes && notes.length > 0 && (
        <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[14px] h-[14px] px-0.5 rounded-full bg-blue-500 text-white font-mono text-[8px] font-semibold border border-background">
          {notes.length}
        </div>
      )}
    </div>
  );
};

export default NotesSelector;
