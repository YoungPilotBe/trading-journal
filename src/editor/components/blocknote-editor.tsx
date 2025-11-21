import "@/blocknote-styles.css";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import "@blocknote/xl-ai/style.css";

import { useDialog } from "@/contexts/dialog-context";
import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { AIMenuController } from "@blocknote/xl-ai";
import { FormattingToolbarWithAI, SuggestionMenuWithAI } from "../menu";

export interface BlockNoteEditorComponentProps {
  editor: BlockNoteEditor;
  onChange?: () => void;
  className?: string;
  style?: React.CSSProperties;
  editable?: boolean;
  children?: React.ReactNode;
}

export function BlockNoteEditorComponent({
  editor,
  onChange,
  className,
  style,
  editable = true,
  children,
}: BlockNoteEditorComponentProps) {
  const { openDialog } = useDialog();

  const handleExcalidrawSave = async (imageBlob: Blob) => {
    try {
      // Convert blob to data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageBlob);
      });

      // Insert image block into BlockNote
      // Get the current block or use the last block if no cursor position
      let currentBlockId: string;
      try {
        const cursorPosition = editor.getTextCursorPosition();
        currentBlockId = cursorPosition.block.id;
      } catch {
        // If no cursor position, insert at the end of the document
        const blocks = editor.document;
        currentBlockId = blocks[blocks.length - 1]?.id || blocks[0]?.id;
      }

      editor.insertBlocks(
        [
          {
            type: "image",
            props: {
              url: dataUrl,
            },
          },
        ],
        currentBlockId,
        "after"
      );
    } catch (error) {
      console.error("Error inserting Excalidraw image:", error);
    }
  };

  return (
    <>
      <BlockNoteView
        className={className}
        style={style}
        editable={editable}
        editor={editor}
        onChange={onChange}
        data-theming-css-demo
      >
        <FormattingToolbarWithAI />
        <SuggestionMenuWithAI
          editor={editor}
          onOpenExcalidraw={() =>
            openDialog("EXCALIDRAW", { onSave: handleExcalidrawSave })
          }
        />
        <AIMenuController />
        {children}
      </BlockNoteView>
    </>
  );
}
