import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSearchImages } from "@/hooks/ai/use-search-images";
import { CheckIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import clsx from "clsx";

interface FindDrawingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  onSelect: (imageUrl: string) => void;
}

export function FindDrawingDialog({
  open,
  onOpenChange,
  description,
  onSelect,
}: FindDrawingDialogProps) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const { mutateAsync: searchImages, data: images, isPending } = useSearchImages();

  // Automatically start searching when dialog opens
  useEffect(() => {
    if (open && description) {
      setSelectedImageUrl(null);
      searchImages({ description }).catch((error) => {
        console.error("Error searching images:", error);
        toast.error("Failed to search for images. Please try again.");
      });
    }
  }, [open, description, searchImages]);

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
  };

  const handleConfirm = () => {
    if (selectedImageUrl) {
      onSelect(selectedImageUrl);
      onOpenChange(false);
      setSelectedImageUrl(null);
    } else {
      toast.error("Please select an image");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Find Drawing</DialogTitle>
          <DialogDescription>
            Select an illustration that best represents your trade template
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Searching for images...
                </p>
              </div>
            </div>
          ) : images && images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-1">
              {images.map((image) => (
                <button
                  key={image.id}
                  onClick={() => handleImageSelect(image.url)}
                  className={clsx(
                    "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                    "hover:scale-105 hover:shadow-lg",
                    selectedImageUrl === image.url
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <img
                    src={image.thumbnailUrl}
                    alt={image.description || "Search result"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedImageUrl === image.url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-2">
                        <CheckIcon className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : images && images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">
                No images found. Try adding more descriptive content to your template.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedImageUrl || isPending}>
            Select Image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

