import { Button } from "@/components/ui/button";
import { DialogHeader } from "@/components/ui/dialog";
import { Excalidraw, exportToBlob } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { SaveIcon } from "lucide-react";
import { useState } from "react";

interface ExcalidrawEditorProps {
  onSave: (imageBlob: Blob) => void;
  onClose: () => void;
}

export function ExcalidrawEditor({ onSave, onClose }: ExcalidrawEditorProps) {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!excalidrawAPI) {
      return;
    }

    try {
      setIsSaving(true);
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      // Prepare appState with dark theme and background export settings
      const exportAppState = {
        ...appState,
        exportWithDarkMode: true, // Preserve dark theme
        exportBackground: true, // Include background color
      };

      // Export drawing as PNG blob
      // Let Excalidraw calculate dimensions from element bounds to ensure correct positioning
      // This will export all elements with proper spacing, matching what you see in the editor
      const blob = await exportToBlob({
        elements,
        appState: exportAppState,
        files,
        mimeType: "image/png",
        // Don't specify getDimensions - let Excalidraw calculate from element bounds
        // This ensures elements are positioned correctly, not at top-left
      });

      onSave(blob);
      onClose();
    } catch (error) {
      console.error("Error exporting Excalidraw drawing:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <DialogHeader className="px-6 py-2 border-b flex-shrink-0">
        <Button
          variant={"default"}
          className="w-fit"
          onClick={handleSave}
          disabled={isSaving}
        >
          <SaveIcon className="size-3" />
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogHeader>
      <div 
        className="flex-1 min-h-0 w-full h-full" 
        style={{ 
          position: "relative",
          padding: 0,
          margin: 0,
          overflow: "hidden"
        }}
      >
        <Excalidraw excalidrawAPI={(api) => setExcalidrawAPI(api)} theme="dark" />
      </div>
    </>
  );
}
