import { Button } from "@/components/ui/button";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

// Or, you can use ariakit, shadcn, etc.
import { BlockNoteView } from "@blocknote/mantine";
// Default styles for the mantine editor
import "@blocknote/mantine/style.css";
// Include the included Inter font
import "@blocknote/core/fonts/inter.css";
import z from "zod";
const searchSchema = z.object({
  imageId: z.optional(z.string()),
});

export const Route = createFileRoute("/trade_template")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function RouteComponent() {
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: "heading",
        content: "",
      },
    ],
    placeholders: {
      heading: "Template Title",
    },
  });

  return (
    <div className="relative xl:max-w-[60%] mx-auto min-h-screen xl:pt-6 flex @container">
      {/* Header Section */}
      <div className="xl:rounded-t-xl bg-card flex-1 flex flex-col">
        <div className="mb-8 space-y-4 flex-shrink-0">
          <div className="h-[300px] flex-1 mx-auto flex items-center justify-center rounded-lg">
            <Button variant="outline" className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Add Drawing
            </Button>
          </div>
        </div>
        {/* Description Editor */}
        <div className="mb-8 flex-1 overflow-y-auto @[600px]:max-h-[calc(100cqh-400px)] max-h-[calc(100vh-400px)]">
          <BlockNoteView
            editor={editor}
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
  );
}
