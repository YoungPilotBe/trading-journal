import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderCircle, PlusIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

// Or, you can use ariakit, shadcn, etc.
import { BlockNoteView } from "@blocknote/mantine";
// Default styles for the mantine editor
import "@blocknote/mantine/style.css";
// Include the included Inter font
import { useGetDrawing } from "@/hooks/drawings/useGetDrawing";
import { useUploadDrawing } from "@/hooks/drawings/useUploadDrawing";
import { useCreateTradeTemplate } from "@/hooks/trade_templates/create_trade_template";
import { useGetTradeTemplate } from "@/hooks/trade_templates/get_trade_template";
import { useUpdateTradeTemplate } from "@/hooks/trade_templates/update_trade_template";
import NavbarPortal from "@/portals/navbar_portal";
import "@blocknote/core/fonts/inter.css";
import { convexQuery } from "@convex-dev/react-query";
import clsx from "clsx";
import { Id } from "convex/_generated/dataModel";
import { useMemo } from "react";
import z from "zod";
import { api } from "../../../../../convex/_generated/api";
const searchSchema = z.object({
  templateId: z.optional(z.string()),
});

export const Route = createFileRoute(
  "/(app)/dashboard/trade_templates/trade_template"
)({
  component: RouteComponent,
  validateSearch: searchSchema,
  loaderDeps: ({ search: { templateId } }) => ({ templateId }),
  loader: async ({ deps: { templateId }, context: { queryClient } }) => {
    if (!templateId) {
      return null;
    }

    await queryClient.fetchQuery(
      convexQuery(api.trade_template.getTemplate, {
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

  const { mutateAsync: createTradeTemplate, isPending: isCreatingTemplate } =
    useCreateTradeTemplate({
      onSuccess: (id) => {
        navigate({
          to: "/dashboard/trade_templates/trade_template",
          search: { templateId: id },
        });
      },
    });
  const { mutateAsync: updateTradeTemplate, isPending: isUpdatingTemplate } =
    useUpdateTradeTemplate();
  const { mutateAsync: uploadDrawing, isPending: isUploading } =
    useUploadDrawing();

  // Get drawing data if template has a drawing
  const { data: drawingData } = useGetDrawing({
    id: existingTemplate?.drawingId,
  });

  const autoSave = useDebouncedCallback(() => {
    handleSave();
  }, 1000);

  // Extract title from document
  const getDocumentTitle = (document: unknown) => {
    if (!document || !Array.isArray(document)) return "Untitled";

    // Look for the first heading block
    const headingBlock = document.find(
      (block: unknown) =>
        typeof block === "object" &&
        block !== null &&
        "type" in block &&
        (block as { type: string }).type === "heading"
    );

    if (
      headingBlock &&
      typeof headingBlock === "object" &&
      headingBlock !== null &&
      "content" in headingBlock &&
      Array.isArray((headingBlock as { content: unknown }).content)
    ) {
      const content = (headingBlock as { content: unknown[] }).content;
      const textContent = content
        .map((item: unknown) =>
          typeof item === "object" && item !== null && "text" in item
            ? (item as { text: string }).text || ""
            : ""
        )
        .join("")
        .trim();
      return textContent || "Untitled";
    }

    return "Untitled";
  };

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

  const editor = useCreateBlockNote({
    initialContent,
    placeholders: {
      heading: "Template Title",
    },
  });

  const documentTitle = useMemo(() => {
    try {
      return existingTemplate?.document[0]?.content[0]?.text ?? "Untitled";
    } catch (error) {
      console.warn("Error extracting document title:", error);
      return "Untitled";
    }
  }, [existingTemplate?.document]);

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
        await uploadDrawing({
          file: file,
        }).then(({ drawingId }) => {
          handleSave(drawingId);
        });

        console.log("Drawing uploaded successfully");
      } catch (uploadError) {
        console.error("Error uploading drawing:", uploadError);
        alert("Failed to upload drawing");
      }
    };

    // Trigger the file picker
    input.click();
  }

  return (
    <>
      <NavbarPortal
        target="navbar-items"
        children={
          <div
            className={clsx(
              "hidden flex-row gap-3 text-muted-foreground items-center starting:opacity-0 transition-opacity",
              (isUpdatingTemplate || isCreatingTemplate) && "!flex"
            )}
          >
            <LoaderCircle className="size-3 animate-spin" />
            <span className="text-xs font-mono ">Auto saving</span>
          </div>
        }
      />
      <div
        className={clsx(
          "relative xl:max-w-7xl mx-auto min-h-screen xl:pt-6 flex-col flex @container",
          (isLoading || isUploading) && "opacity-50 pointer-events-none"
        )}
      >
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <button
                    onClick={() =>
                      navigate({ to: "/dashboard/trade_templates" })
                    }
                    className="hover:text-foreground transition-colors"
                  >
                    Trade Templates
                  </button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{documentTitle.toString()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header Section */}
        <div className="xl:rounded-t-xl bg-card flex-1 flex flex-col">
          <div className="mb-8 space-y-4 flex-shrink-0">
            <div className="h-[300px] w-full mx-auto relative overflow-hidden border">
              {drawingData?.url ? (
                <>
                  {/* Display the uploaded image */}
                  <img
                    src={drawingData.url}
                    alt="Trade template drawing"
                    className="w-full h-full object-cover"
                  />
                  {/* Button overlay - always visible on top */}
                  <div className="absolute top-2 right-2">
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
          <div className="mb-8 flex-1 overflow-y-auto @[600px]:max-h-[calc(100cqh-400px)] max-h-[calc(100vh-400px)]">
            <BlockNoteView
              editable
              editor={editor}
              onChange={() => autoSave()}
              theme={{
                light: {
                  borderRadius: 0,
                  colors: {
                    editor: {
                      background: "transparent",
                    },
                  },
                },
                dark: {
                  borderRadius: 0,
                  colors: {
                    editor: {
                      background: "transparent",
                    },
                  },
                },
              }}
              style={{
                backgroundColor: "transparent",
                minHeight: "300px",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
