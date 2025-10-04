import { useGetNote } from "@/hooks/notes/use-get-note";
import { useUpdateNote } from "@/hooks/notes/use-update-note";
import Portal from "@/portals/portal";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import clsx from "clsx";
import { Id } from "convex/_generated/dataModel";
import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import AutoSavePortal from "./portals/auto-save-portal";

type BlockNoteDocument = unknown[];

interface NoteEditorProps {
  noteId: Id<"notes">;
  isDisabled?: boolean;
}

const NoteEditor = ({ noteId }: NoteEditorProps) => {
  const { data: note, isLoading: isLoadingNote } = useGetNote({ id: noteId });
  const { mutateAsync: updateNote, isPending: isUpdatingNote } =
    useUpdateNote();

  // Create editor with default content
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: "heading",
        content: "",
      },
    ],
    placeholders: {
      heading: "Note Title",
    },
  });

  // Load note content only when noteId changes
  useEffect(() => {
    function loadNoteContent() {
      if (!note?.document || !Array.isArray(note.document)) {
        // Clear editor if no valid document data
        editor.replaceBlocks(editor.document, [
          {
            type: "heading",
            content: "",
          },
        ]);
        return;
      }

      editor.replaceBlocks(editor.document, note.document);
    }

    // Only load content if noteId has actually changed
    loadNoteContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, note?._id]);

  // Auto-save functionality
  const autoSave = useDebouncedCallback(() => {
    handleAutoSave();
  }, 1000);

  // Load note content into editor

  // Handle auto-save
  async function handleAutoSave() {
    if (!noteId) {
      return;
    }

    await updateNote({
      noteId,
      document: editor.document,
      title: getNoteTitle(editor.document),
    });
  }

  // Extract title from document
  function getNoteTitle(document: BlockNoteDocument) {
    const firstBlock = document?.[0] as {
      type?: string;
      content?: Array<{ text?: string }>;
    };

    if (firstBlock?.type === "heading" && firstBlock.content?.[0]?.text) {
      return firstBlock.content[0].text;
    }

    return "Untitled";
  }

  if (isLoadingNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">Loading note...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("flex-1 bg-muted rounded-lg overflow-hidden")}>
      <Portal
        target="note-view-navbar"
        children={
          <AutoSavePortal
            isSaving={isUpdatingNote}
            className="absolute top-4 right-12"
          />
        }
      />
      <BlockNoteView
        editor={editor}
        onChange={() => autoSave()}
        theme={{
          light: {
            borderRadius: 0,
            colors: {
              editor: {
                background: "transparent",
              },
            },
          },
          dark: {
            borderRadius: 0,
            colors: {
              editor: {
                background: "transparent",
              },
            },
          },
        }}
        style={{
          backgroundColor: "transparent",
          height: "100%",
        }}
      />
    </div>
  );
};

export default NoteEditor;
