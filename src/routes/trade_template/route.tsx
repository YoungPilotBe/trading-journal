import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { BlockNoteEditorComponent, useBlockNoteEditor } from "@/editor";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  MaximizeIcon,
  MinimizeIcon,
  MoveIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import AutoSavePortal from "@/components/portals/auto-save-portal";
import { TemplateAnalytics } from "@/components/template-analytics";
import { useDialog } from "@/contexts/dialog-context";
import { useMoveImage } from "@/hooks/drawings/use-move-image";
import { useGetDrawing } from "@/hooks/drawings/useGetDrawing";
import { useUploadDrawing } from "@/hooks/drawings/useUploadDrawing";
import { useCreateTradeTemplate } from "@/hooks/trade_templates/create_trade_template";
import { useGetTradeTemplate } from "@/hooks/trade_templates/get_trade_template";
import { useUpdateTradeTemplate } from "@/hooks/trade_templates/update_trade_template";
import {
  extractTextFromBlocks,
  isValidDescription,
} from "@/utils/blocknote-text-extraction";
import { convexQuery } from "@convex-dev/react-query";
import clsx from "clsx";
import { Id } from "convex/_generated/dataModel";
import { useMemo } from "react";
import { toast } from "sonner";
import z from "zod";

import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";

const searchSchema = z.object({
  templateId: z.optional(z.string()),
});

export const Route = createFileRoute("/trade_template")({
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search: { templateId } }) => ({ templateId }),
  loader: async ({ deps: { templateId }, context: { queryClient } }) => {
    if (!templateId) {
      return null;
    }

    await queryClient.fetchQuery(
      convexQuery(api.template.queries.getTemplate, {
        id: templateId as Id<"trade_templates">,
      })
    );
  },
});

function RouteComponent() {
  const { templateId } = Route.useSearch();
  const navigate = useNavigate();

  const { data: existingTemplate, isLoading } = useGetTradeTemplate({
    id: templateId as Id<"trade_templates">,
  });
  const { data: drawingData } = useGetDrawing({
    id: existingTemplate?.drawingId,
  });

  // Get the image URL from the uploaded drawing
  const imageUrl = drawingData?.url;

  // Get zoom mode from template (default to "cover")
  const zoomMode = existingTemplate?.zoomMode ?? "cover";

  const { openDialog } = useDialog();

  // Image movement hook
  const {
    imageOffsetY,
    isMoveMode,
    isDragging,
    imageRef,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    resetPosition,
    toggleMoveMode,
  } = useMoveImage(drawingData ?? undefined);

  const { mutateAsync: createTradeTemplate, isPending: isCreatingTemplate } =
    useCreateTradeTemplate({
      onSuccess: (id) => {
        navigate({
          to: "/trade_template",
          search: { templateId: id },
        });
      },
    });
  const { mutateAsync: updateTradeTemplate, isPending: isUpdatingTemplate } =
    useUpdateTradeTemplate();
  const { mutateAsync: uploadDrawing, isPending: isUploading } =
    useUploadDrawing();
  const downloadImageAction = useAction(api.image_search.actions.downloadImage);

  // Get drawing data if template has a drawing

  const autoSave = useDebouncedCallback(() => {
    handleSave();
  }, 1000);

  const initialContent = useMemo(() => {
    return (
      existingTemplate?.document ?? [
        {
          id: "title",
          type: "heading",
          content: "",
        },
      ]
    );
  }, [existingTemplate]);

  const { editor } = useBlockNoteEditor({
    config: {
      initialContent,
      placeholder: "Note Title",
      loadContentDynamically: false,
    },
  });

  async function handleSave(
    drawingId?: Id<"drawings">,
    zoomMode?: "cover" | "contain"
  ) {
    if (!templateId) {
      await createTradeTemplate({
        document: editor.document,
        drawingId: drawingId ?? undefined,
        zoomMode: zoomMode ?? "cover",
      });
      return;
    }

    await updateTradeTemplate({
      id: templateId as Id<"trade_templates">,
      document: editor.document,
      drawingId: drawingId ?? undefined,
      zoomMode: zoomMode ?? existingTemplate?.zoomMode ?? "cover",
    });
  }

  async function handleToggleZoomMode() {
    const newZoomMode = zoomMode === "cover" ? "contain" : "cover";
    // Disable move mode when switching to contain mode
    if (newZoomMode === "contain" && isMoveMode) {
      toggleMoveMode();
    }
    await handleSave(undefined, newZoomMode);
  }

  function base64ToBlob(base64Data: string, contentType: string): Blob {
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: contentType });
  }

  function isImageFormat(bytes: Uint8Array): boolean {
    if (bytes.length < 4) return false;

    const isPNG =
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47;
    const isJPEG = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isGIF =
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38;
    const isWebP =
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50;

    return isPNG || isJPEG || isGIF || isWebP;
  }

  async function convertToPNG(originalBlob: Blob): Promise<Blob> {
    const blobUrl = URL.createObjectURL(originalBlob);
    try {
      return await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        const timeout = setTimeout(
          () => reject(new Error("Image load timeout")),
          10000
        );

        img.onload = () => {
          clearTimeout(timeout);
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to create canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            blob
              ? resolve(blob)
              : reject(new Error("Failed to convert to PNG"));
          }, "image/png");
        };

        img.onerror = () => {
          clearTimeout(timeout);
          resolve(originalBlob);
        };

        img.src = blobUrl;
      });
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  async function handleImageDownloadAndUpload(imageUrl: string) {
    try {
      toast.info("Downloading image...");
      const { data: base64Data, contentType } = await downloadImageAction({
        imageUrl,
      });

      if (!contentType?.startsWith("image/")) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      const blob = base64ToBlob(base64Data, contentType);
      const bytes = new Uint8Array(await blob.arrayBuffer());

      if (!isImageFormat(bytes)) {
        throw new Error("Downloaded file is not a valid image format");
      }

      const imageBlob = contentType.includes("png")
        ? blob
        : await convertToPNG(blob).catch(() => blob);

      toast.info("Uploading image...");
      const { drawingId } = await uploadDrawing({ file: imageBlob });
      await handleSave(drawingId);
      await resetPosition();
      toast.success("Image saved successfully");
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to download and save image"
      );
    }
  }

  function handleFindDrawing() {
    const description = extractTextFromBlocks(editor.document);

    if (!isValidDescription(description)) {
      toast.error(
        "Please add descriptive content to the template before searching for images"
      );
      return;
    }

    openDialog("FIND_DRAWING", {
      description,
      onSelect: async (imageUrl: string) => {
        try {
          await handleImageDownloadAndUpload(imageUrl);
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to download and save image"
          );
        }
      },
    });
  }

  async function handleUploadDrawing() {
    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".png,image/png";
    input.multiple = false;

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.includes("png")) {
        alert("Please select a PNG file");
        return;
      }

      try {
        // Upload the file directly at its original size
        const { drawingId } = await uploadDrawing({
          file: file,
        });

        await handleSave(drawingId);
        await resetPosition();
      } catch (uploadError) {
        alert("Failed to upload drawing");
      }
    };

    // Trigger the file picker
    input.click();
  }

  return (
    <div
      className={clsx(
        "relative xl:max-w-7xl mx-auto min-h-screen xl:pt-6 flex-col flex @container",
        (isLoading || isUploading) && "opacity-50 pointer-events-none"
      )}
    >
      {/* Breadcrumbs */}
      <div className="mb-6 relative">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <button
                  onClick={() => navigate({ to: "/dashboard/trade_templates" })}
                  className="hover:text-foreground transition-colors"
                >
                  Trade Templates
                </button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {existingTemplate?.title.toString()}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="top-1/2 absolute -translate-y-1/2 right-0 inline-flex flex-row gap-2 items-center">
          <AutoSavePortal isSaving={isUpdatingTemplate || isCreatingTemplate} />
          {templateId && (
            <TemplateAnalytics
              templateId={templateId as Id<"trade_templates">}
              existingTemplate={existingTemplate}
              onDelete={() => {
                if (existingTemplate) {
                  openDialog("DELETE_TRADE_TEMPLATE", {
                    template: existingTemplate,
                  });
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Header Section */}
      <div className="xl:rounded-t-xl bg-card flex-1 flex flex-col">
        <div className="mb-8 space-y-4 flex-shrink-0">
          <div
            ref={containerRef}
            className="h-[300px] w-full mx-auto relative overflow-hidden"
            onMouseDown={zoomMode === "cover" ? handleMouseDown : undefined}
            onMouseMove={zoomMode === "cover" ? handleMouseMove : undefined}
            onMouseUp={zoomMode === "cover" ? handleMouseUp : undefined}
            onMouseLeave={zoomMode === "cover" ? handleMouseUp : undefined}
            onTouchStart={zoomMode === "cover" ? handleTouchStart : undefined}
            onTouchMove={zoomMode === "cover" ? handleTouchMove : undefined}
            onTouchEnd={zoomMode === "cover" ? handleTouchEnd : undefined}
            style={{
              cursor:
                zoomMode === "cover" && isMoveMode ? "ns-resize" : "default",
              touchAction: zoomMode === "cover" && isMoveMode ? "none" : "auto",
            }}
          >
            {imageUrl ? (
              <>
                {/* Display the uploaded image */}
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Trade template drawing"
                  className={clsx(
                    "w-full transition-[padding,filter] duration-300 ease-in-out",
                    zoomMode === "cover" && isMoveMode && "brightness-50"
                  )}
                  style={{
                    height: zoomMode === "contain" ? "100%" : "auto",
                    minHeight: zoomMode === "cover" ? "100%" : "auto",
                    objectFit: zoomMode,
                    paddingTop: zoomMode === "cover" ? "1rem" : "0",
                    paddingBottom: zoomMode === "cover" ? "1rem" : "0",
                    transform:
                      zoomMode === "cover"
                        ? `translateY(${imageOffsetY}px)`
                        : "translateY(0px)",
                    transition:
                      zoomMode === "cover" && isDragging
                        ? "none"
                        : zoomMode === "cover"
                          ? "transform 0.2s ease, height 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding-top 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                          : "height 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding-top 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onDragStart={(e) => e.preventDefault()}
                  draggable={false}
                />

                {/* Move mode overlay with instructions */}
                {zoomMode === "cover" && isMoveMode && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-white px-6 py-3 rounded-lg backdrop-blur-sm">
                      <p className="text-sm font-medium">Drag Up / Down</p>
                    </div>
                  </div>
                )}
                {/* Button overlay - always visible on top */}
                <div className="absolute top-2 right-2 flex gap-2">
                  {zoomMode === "cover" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={clsx(
                        "flex items-center gap-2 bg-white/90 backdrop-blur-sm",
                        isMoveMode && "bg-primary text-primary-foreground"
                      )}
                      onClick={toggleMoveMode}
                    >
                      <MoveIcon className="w-4 h-4" />
                      Move
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className={clsx("flex items-center gap-2 backdrop-blur-sm")}
                    onClick={handleToggleZoomMode}
                    title={
                      zoomMode === "cover"
                        ? "Switch to fit mode"
                        : "Switch to cover mode"
                    }
                  >
                    {zoomMode === "cover" ? (
                      <>
                        <MaximizeIcon className="w-4 h-4" />
                        Fit
                      </>
                    ) : (
                      <>
                        <MinimizeIcon className="w-4 h-4" />
                        Cover
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-white/90 backdrop-blur-sm"
                    onClick={handleFindDrawing}
                  >
                    <SearchIcon className="w-4 h-4" />
                    Find Drawing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 bg-white/90 backdrop-blur-sm"
                    onClick={handleUploadDrawing}
                    disabled={isUploading}
                  >
                    <PlusIcon className="w-4 h-4" />
                    {isUploading ? "Uploading..." : "Replace"}
                  </Button>
                </div>
              </>
            ) : (
              /* No image - show centered buttons */
              <div className="w-full h-full flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleFindDrawing}
                >
                  <SearchIcon className="w-4 h-4" />
                  Find Drawing
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleUploadDrawing}
                  disabled={isUploading}
                >
                  <PlusIcon className="w-4 h-4" />
                  {isUploading ? "Uploading..." : "Add Drawing"}
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* Description Editor */}
        <div className="pt-4 flex-1 bg-muted">
          <BlockNoteEditorComponent
            editor={editor}
            onChange={() => autoSave()}
            style={{
              backgroundColor: "transparent",
              height: "100%",
              paddingBottom: "200px", // Add extra scrollable space within the editor
            }}
          />
        </div>
      </div>
    </div>
  );
}
