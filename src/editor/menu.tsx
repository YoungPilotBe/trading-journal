import { BlockNoteEditor, filterSuggestionItems } from "@blocknote/core";
import {
  FormattingToolbar,
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  getFormattingToolbarItems,
  SuggestionMenuController,
} from "@blocknote/react";
import { AIToolbarButton, getAISlashMenuItems } from "@blocknote/xl-ai";
import { Pencil } from "lucide-react";
import { createElement } from "react";

export function FormattingToolbarWithAI() {
  return (
    <FormattingToolbarController
      formattingToolbar={() => (
        <FormattingToolbar>
          {...getFormattingToolbarItems()}
          {/* Add the AI button */}
          <AIToolbarButton />
        </FormattingToolbar>
      )}
    />
  );
}
// Slash menu with the AI option added
export function SuggestionMenuWithAI(props: {
  editor: BlockNoteEditor;
  onOpenExcalidraw?: () => void;
}) {
  const getExcalidrawMenuItem = () => {
    if (!props.onOpenExcalidraw) return null;
    return {
      title: "Excalidraw",
      onItemClick: () => {
        props.onOpenExcalidraw?.();
      },
      aliases: ["excalidraw", "drawing", "sketch"],
      group: "Media",
      icon: createElement(Pencil, { size: 18 }),
    };
  };

  return (
    <SuggestionMenuController
      triggerCharacter="/"
      getItems={async (query) => {
        const items = [
          ...getDefaultReactSlashMenuItems(props.editor),
          // add the default AI slash menu items, or define your own
          ...getAISlashMenuItems(props.editor),
        ];
        const excalidrawItem = getExcalidrawMenuItem();
        if (excalidrawItem) {
          items.push(excalidrawItem);
        }
        return filterSuggestionItems(items, query);
      }}
      onItemClick={(item) => {
        item.onItemClick();
      }}
    />
  );
}
