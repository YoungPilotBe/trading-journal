import { Button } from "@/components/ui/button";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

// Or, you can use ariakit, shadcn, etc.
import { BlockNoteView } from "@blocknote/mantine";
// Default styles for the mantine editor
import "@blocknote/mantine/style.css";
// Include the included Inter font
import { useCreateTradeTemplate } from "@/hooks/trade_templates/create_trade_template";
import { useGetTradeTemplate } from "@/hooks/trade_templates/get_trade_template";
import { useUpdateTradeTemplate } from "@/hooks/trade_templates/update_trade_template";
import "@blocknote/core/fonts/inter.css";
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

  const { mutateAsync: createTradeTemplate } = useCreateTradeTemplate({
    onSuccess: (id) => {
      navigate({ to: "/trade_template", search: { templateId: id } });
    },
  });
  const { mutateAsync: updateTradeTemplate } = useUpdateTradeTemplate();

  const autoSave = useDebouncedCallback(() => {
    handleAutoSave();
  }, 1000);

  const initialContent = useMemo(() => {
    return (
      existingTemplate?.document ?? [
        {
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

  async function handleAutoSave() {
    if (!templateId) {
      await createTradeTemplate({
        document: editor.document,
      });
      return;
    }

    if (templateId) {
      await updateTradeTemplate({
        id: templateId as Id<"trade_templates">,
        document: editor.document,
      });
    }
  }

  return (
    <div
      className={clsx(
        "relative xl:max-w-[60%] mx-auto min-h-screen xl:pt-6 flex @container",
        isLoading && "opacity-50 pointer-events-none"
      )}
    >
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
  );
}
