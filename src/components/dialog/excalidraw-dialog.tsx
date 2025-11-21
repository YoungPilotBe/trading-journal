import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ExcalidrawEditor } from "@/editor/components/excalidraw-editor";

interface ExcalidrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (imageBlob: Blob) => void;
}

export function ExcalidrawDialog({
  open,
  onOpenChange,
  onSave,
}: ExcalidrawDialogProps) {
  const handleSave = (imageBlob: Blob) => {
    onSave(imageBlob);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[90vw] !w-full !max-h-[90vh] !h-full flex flex-col p-0 overflow-hidden gap-0"
        showCloseButton={false}
        style={{ padding: 0 }}
      >
        <ExcalidrawEditor onSave={handleSave} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
