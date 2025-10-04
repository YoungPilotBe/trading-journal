import StatusOption from "@/components/status-option";
import clsx from "clsx";
import { Doc, Id } from "convex/_generated/dataModel";
import { Trash2Icon } from "lucide-react";
import { Fragment } from "react";

type NoteCardProps = {
  note: Doc<"notes">;
  isSelected: boolean;
  isUpdating: boolean;
  onSelect: () => void;
  onDelete: (noteId: Id<"notes">) => Promise<void>;
  showSeparator?: boolean;
  separatorText?: string;
};

const NoteCard = ({
  note,
  isSelected,
  isUpdating,
  onSelect,
  onDelete,
  showSeparator,
  separatorText,
}: NoteCardProps) => {
  const handleClick = () => {
    if (!isUpdating) {
      onSelect();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUpdating) {
      await onDelete(note._id);
    }
  };

  const renderSeparator = () => {
    if (!showSeparator) return null;

    if (separatorText) {
      return (
        <div className="h-6 flex items-center relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[7px] text-muted-foreground uppercase tracking-wider font-medium whitespace-nowrap font-mono">
            {separatorText}
          </span>
          <div className="w-px h-full bg-border" />
        </div>
      );
    }

    return (
      <div className="h-6 flex items-center">
        <div className="w-px h-full bg-border" />
      </div>
    );
  };

  return (
    <Fragment>
      <div
        className={clsx(
          "p-3 rounded-lg border transition grid grid-cols-[1fr_auto_auto] gap-2 items-center starting:translate-y-4 ease-out",
          isUpdating
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:bg-muted",
          isSelected && "bg-accent border-accent-foreground/20"
        )}
        onClick={handleClick}
      >
        <div className="min-w-0">
          <h4
            className={clsx(
              "text-sm font-medium truncate",
              note.title === "Untitled" && "text-muted-foreground"
            )}
          >
            {note.title}
          </h4>
        </div>
        <StatusOption snapshotId={note.snapshotId} disableSeparators />
        <button
          type="button"
          className={clsx(
            "w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-sm",
            isUpdating && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleDelete}
          disabled={isUpdating}
        >
          <Trash2Icon className="w-4 h-4" />
        </button>
      </div>
      {renderSeparator()}
    </Fragment>
  );
};

export default NoteCard;
