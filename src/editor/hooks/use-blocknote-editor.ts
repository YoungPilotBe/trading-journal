import { model } from "@/ai/openai";
import { en } from "@blocknote/core/locales";
import { useCreateBlockNote } from "@blocknote/react";
import { ClientSideTransport, createAIExtension } from "@blocknote/xl-ai";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import { useEffect } from "react";

export interface BlockNoteEditorConfig {
  initialContent?: any[];
  placeholder?: string;
  loadContentDynamically?: boolean;
  onContentChange?: (content: any[]) => void;
}

export interface UseBlockNoteEditorProps {
  config: BlockNoteEditorConfig;
  existingContent?: any[];
  contentId?: string;
}

export function useBlockNoteEditor({
  config,
  existingContent,
  contentId,
}: UseBlockNoteEditorProps) {
  const {
    initialContent,
    placeholder = "Note Title",
    loadContentDynamically = false,
    onContentChange,
  } = config;

  // Create the editor with base configuration
  const editor = useCreateBlockNote({
    initialContent: loadContentDynamically ? undefined : initialContent,
    dictionary: {
      ...en,
      ai: aiEn,
    },
    extensions: [
      createAIExtension({
        transport: new ClientSideTransport({
          model,
        }),
      }),
    ],
    placeholders: {
      heading: placeholder,
    },
  });

  // Handle dynamic content loading (for notes)
  useEffect(() => {
    if (!loadContentDynamically || !existingContent) return;

    function loadContent() {
      if (!existingContent || !Array.isArray(existingContent)) {
        // Clear editor if no valid document data
        editor.replaceBlocks(editor.document, [
          {
            type: "heading",
            content: "",
          },
        ]);
        return;
      }

      editor.replaceBlocks(editor.document, existingContent);
    }

    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, contentId]);

  // Handle content changes
  useEffect(() => {
    if (onContentChange) {
      const unsubscribe = editor.onChange(() => {
        onContentChange(editor.document);
      });
      return unsubscribe;
    }
  }, [editor, onContentChange]);

  return {
    editor,
  };
}
