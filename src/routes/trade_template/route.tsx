import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BlockNoteEditorComponent, useBlockNoteEditor } from "@/editor";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MoveIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import AutoSavePortal from "@/components/portals/auto-save-portal";
import { useDialog } from "@/contexts/dialog-context";
import { useMoveImage } from "@/hooks/drawings/use-move-image";
import { useGetDrawing } from "@/hooks/drawings/useGetDrawing";
import { useUploadDrawing } from "@/hooks/drawings/useUploadDrawing";
import { useCreateTradeTemplate } from "@/hooks/trade_templates/create_trade_template";
import { useGetTradeTemplate } from "@/hooks/trade_templates/get_trade_template";
import { useUpdateTradeTemplate } from "@/hooks/trade_templates/update_trade_template";
import { convexQuery } from "@convex-dev/react-query";
import clsx from "clsx";
import { Id } from "convex/_generated/dataModel";
import { useMemo } from "react";
import z from "zod";

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

  async function handleSave(drawingId?: Id<"drawings">) {
    if (!templateId) {
      await createTradeTemplate({
        document: editor.document,
        drawingId: drawingId ?? undefined,
      });
      return;
    }

    if (templateId) {
      await updateTradeTemplate({
        id: templateId as Id<"trade_templates">,
        document: editor.document,
        drawingId: drawingId ?? undefined,
      });
    }
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

        <div className="top-1/2 absolute -translate-y-1/2 right-0 inline-flex flex-row gap-2">
          <AutoSavePortal isSaving={isUpdatingTemplate || isCreatingTemplate} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  if (existingTemplate) {
                    openDialog("DELETE_TRADE_TEMPLATE", {
                      template: existingTemplate,
                    });
                  }
                }}
                variant={"ghost"}
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete template</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Header Section */}
      <div className="xl:rounded-t-xl bg-card flex-1 flex flex-col">
        <div className="mb-8 space-y-4 flex-shrink-0">
          <div
            ref={containerRef}
            className="h-[300px] w-full mx-auto relative overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              cursor: isMoveMode ? "ns-resize" : "default",
              touchAction: isMoveMode ? "none" : "auto",
            }}
          >
            {drawingData?.url ? (
              <>
                {/* Display the uploaded image */}
                <img
                  ref={imageRef}
                  src={drawingData.url}
                  alt="Trade template drawing"
                  className={clsx(
                    "w-full py-4 transition-all duration-200",
                    isMoveMode && "brightness-50"
                  )}
                  style={{
                    minHeight: "100%",
                    objectFit: "cover",
                    transform: `translateY(${imageOffsetY}px)`,
                    transition: isDragging ? "none" : "transform 0.2s ease",
                  }}
                  onDragStart={(e) => e.preventDefault()}
                  draggable={false}
                />

                {/* Move mode overlay with instructions */}
                {isMoveMode && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-white px-6 py-3 rounded-lg backdrop-blur-sm">
                      <p className="text-sm font-medium">Drag Up / Down</p>
                    </div>
                  </div>
                )}
                {/* Button overlay - always visible on top */}
                <div className="absolute top-2 right-2 flex gap-2">
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
              /* No image - show centered button */
              <div className="w-full h-full flex items-center justify-center">
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
