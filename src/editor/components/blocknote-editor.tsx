import "@/blocknote-styles.css";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import "@blocknote/xl-ai/style.css";

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
  return (
    <BlockNoteView
      className={className}
      style={style}
      editable={editable}
      editor={editor}
      onChange={onChange}
      data-theming-css-demo
    >
      <FormattingToolbarWithAI />
      <SuggestionMenuWithAI editor={editor} />
      <AIMenuController />
      {children}
    </BlockNoteView>
  );
}
