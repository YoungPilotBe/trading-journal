import { useGenerateNoteTitle } from "@/hooks/ai/use-generate-note-title";
import { useGetNote } from "@/hooks/notes/use-get-note";
import { useUpdateNote } from "@/hooks/notes/use-update-note";
import Portal from "@/portals/portal";
import clsx from "clsx";
import { Id } from "convex/_generated/dataModel";
import { Loader2, TypeIcon } from "lucide-react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";
import AutoSavePortal from "./portals/auto-save-portal";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Button } from "./ui/button";

import { BlockNoteEditorComponent, useBlockNoteEditor } from "@/editor";

interface NoteEditorProps {
  noteId: Id<"notes">;
  isDisabled?: boolean;
}

const NoteEditor = ({ noteId }: NoteEditorProps) => {
  const { data: note, isLoading: isLoadingNote } = useGetNote({ id: noteId });
  const { mutateAsync: updateNote, isPending: isUpdatingNote } =
    useUpdateNote();

  // AI title generation
  const { mutateAsync: generateTitle, isPending: isGeneratingTitle } =
    useGenerateNoteTitle();

  // Create editor with centralized hook
  const { editor } = useBlockNoteEditor({
    config: {
      initialContent: [
        {
          type: "heading",
          content: "",
        },
      ],
      placeholder: "Note Title",
      loadContentDynamically: true,
    },
    existingContent: note?.document,
    contentId: note?._id,
  });

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
    });
  }

  // Handle AI title generation
  const handleGenerateTitle = async () => {
    try {
      // Convert editor content to text

      if (!editor.document) {
        toast.error("Please add some content to generate a title");
        return;
      }

      // Generate title using AI
      const generatedTitle = await generateTitle({
        content: JSON.stringify(editor.document),
      });

      await updateNote({ noteId, title: generatedTitle });

      toast.success("Title generated successfully!");
    } catch (error) {
      console.error("Error generating title:", error);
      toast.error("Failed to generate title. Please try again.");
    }
  };

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
          // Padding of 4 + sidebar width = 64 + 4 = 68
          <div className="ml-68 flex flex-row justify-between items-center w-full">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <button className="hover:text-foreground transition-colors">
                      Notes
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="flex items-center gap-2">
                    {note?.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="inline-flex flex-row gap-3">
              <AutoSavePortal isSaving={isUpdatingNote} />
              <Button
                variant="outline"
                size="badge"
                className="text-[10px]"
                onClick={handleGenerateTitle}
                disabled={isGeneratingTitle}
              >
                {isGeneratingTitle ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <TypeIcon className="size-3" />
                )}
                {isGeneratingTitle ? "Generating..." : "Generate Title"}
              </Button>
            </div>
          </div>
        }
      />

      <BlockNoteEditorComponent
        className="pt-6"
        editor={editor}
        onChange={() => autoSave()}
      />
    </div>
  );
};

export default NoteEditor;
