import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useCreateNote } from "@/hooks/notes/use-create-note";
import { useDeleteNote } from "@/hooks/notes/use-delete-note";
import { useGetNotesSnapshot } from "@/hooks/notes/use-get-notes-snapshot";
import { useUpdateNote } from "@/hooks/notes/use-update-note";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "@blocknote/shadcn/style.css";
import { useNavigate, useSearch } from "@tanstack/react-router";
import clsx from "clsx";
import { Doc, Id } from "convex/_generated/dataModel";
import { PlusIcon, Trash2Icon } from "lucide-react";
import NoteEditor from "../note-editor";
import StatusOption from "../status-option";

interface NotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshotId: Id<"snapshots">;
  tradeSetupId: Id<"trade_setups">;
  snapshot?: Doc<"snapshots"> | null;
  onSave: (notes: BlockNoteDocument[]) => void;
}

type BlockNoteDocument = unknown[];

const NotesDialog = ({ open, onOpenChange }: NotesDialogProps) => {
  const { snapshotId, noteId } = useSearch({
    from: "/(app)/dashboard/setup",
  });

  const search = useSearch({
    from: "/(app)/dashboard/setup",
  });
  const navigate = useNavigate();

  // Handle dialog close and remove noteId from search params
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && noteId) {
      // Dialog is being closed and there's a noteId, remove it from search params
      navigate({
        to: "/dashboard/setup",
        search: { ...search, noteId: undefined },
        replace: true,
      });
    }
    onOpenChange(newOpen);
  };

  const { isPending: isUpdatingNote } = useUpdateNote();

  const { mutateAsync: deleteNote } = useDeleteNote({
    onMutate: () => {
      navigate({
        to: "/dashboard/setup",
        search: { ...search, noteId: undefined },
      });
    },
  });

  const { data: snapshotNotes } = useGetNotesSnapshot({
    snapshotId,
  });

  const { mutateAsync: createNote } = useCreateNote({
    onSuccess: ({ noteId }) => {
      // Add the noteId to the current search params!
      navigate({
        to: "/dashboard/setup",
        search: (prev) => ({ ...prev, ...search, noteId }),
        replace: true, // Use replace to avoid adding to history
      });
    },
  });

  async function handleCreateNote() {
    await createNote({ snapshotId });
  }

  const handleDeleteNote = async (noteId: Id<"notes">) => {
    await deleteNote({ noteId });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex flex-col h-[70vh] font-mono ring-0"
        style={{ maxWidth: "70vw", width: "70vw" }}
      >
        <DialogHeader id="note-view-navbar" className="mb-2" />

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Notes List Sidebar */}
          <div className="w-64 border-r pr-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium flex flex-row gap-1 items-center">
                Notes
                <span className="text-muted-foreground">
                  ({snapshotNotes?.length})
                </span>
              </h3>
              <Button
                variant="outline"
                onClick={handleCreateNote}
                size="sm"
                className={clsx(
                  "size-6 rounded-none",
                  isUpdatingNote && "opacity-50 cursor-not-allowed"
                )}
                disabled={isUpdatingNote}
              >
                <PlusIcon />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {snapshotNotes?.length && (
                <div className="grid gap-2">
                  {snapshotNotes?.map((note, index) => (
                    <div
                      key={`current-${index}`}
                      className={clsx(
                        "p-3 rounded-lg border transition-colors grid grid-cols-[1fr_auto_auto] gap-2 items-center",
                        isUpdatingNote
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer hover:bg-muted",
                        noteId === note._id &&
                          "bg-accent border-accent-foreground/20"
                      )}
                      onClick={() => {
                        if (!isUpdatingNote) {
                          navigate({
                            to: "/dashboard/setup",
                            search: (prev) => ({
                              ...prev,
                              ...search,
                              noteId: note._id,
                            }),
                            replace: true,
                          });
                        }
                      }}
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
                      <StatusOption
                        snapshotId={note.snapshotId}
                        disableSeparators
                      />
                      <button
                        type="button"
                        className={clsx(
                          "w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded-sm",
                          isUpdatingNote && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await handleDeleteNote(note._id);
                        }}
                        disabled={isUpdatingNote}
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {snapshotNotes?.length === 0 &&
                (!snapshotNotes || snapshotNotes.length === 0) && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No notes yet. Click "Add Note" to get started.
                  </div>
                )}
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {noteId ? (
              <NoteEditor noteId={noteId} isDisabled={isUpdatingNote} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">
                    Select a note to edit or create a new one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotesDialog;
