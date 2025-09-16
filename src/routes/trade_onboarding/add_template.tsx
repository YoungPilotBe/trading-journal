import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useGetDrawing } from "@/hooks/drawings/useGetDrawing";
import { useUpdateTradeSetup } from "@/hooks/trade-setup/use-update-trade-setup";
import { useGetAllTradeTemplates } from "@/hooks/trade_templates/get_all_trade_templates";
import { TradeTemplate } from "@/types/trade-template";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { Id } from "convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { CalendarIcon, ImageIcon } from "lucide-react";
import { useMemo, useState } from "react";
import z from "zod";

const searchSchema = z.object({
  tradeSetupId: z.string(),
  snapshotId: z.string(),
});

export const Route = createFileRoute("/trade_onboarding/add_template")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function RouteComponent() {
  const { data: templates, isLoading } = useGetAllTradeTemplates();

  const [searchValue, setSearchValue] = useState("");

  // TODO
  // Helper function to extract title from document
  const getDocumentTitle = (document: unknown) => {
    try {
      const doc = document as {
        [0]?: { content?: { [0]?: { text?: string } } };
      } | null;
      return doc?.[0]?.content?.[0]?.text ?? "Untitled";
    } catch (error) {
      console.warn("Error extracting document title:", error);
      return "Untitled";
    }
  };

  // Filter templates based on search value
  const filteredTemplates = useMemo(() => {
    if (!templates || !searchValue.trim()) return templates || [];

    return templates.filter((template) => {
      const title = getDocumentTitle(template.document);
      return title.toLowerCase().includes(searchValue.toLowerCase());
    });
  }, [templates, searchValue]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Left-side template list */}
      <div className="absolute left-[10%] right-[60%] top-[20%] bottom-[20%] pointer-events-auto">
        {/* Command component for filtering */}
        <div className="p-4  border-muted font-mono">
          <h2 className="text-lg font-semibold mb-3">Trade Templates</h2>
          <Command className="rounded-lg border shadow-md">
            <CommandInput
              placeholder="Search templates..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>No templates found.</CommandEmpty>
              <CommandGroup>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">
                      Loading templates...
                    </div>
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <CommandItem key={template._id}>
                      <TemplateCard template={template} />
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: TradeTemplate }) {
  const { data: drawingData } = useGetDrawing({
    id: template.drawingId as Id<"drawings">,
  });

  const navigate = useNavigate();
  const search = Route.useSearch();
  const { mutateAsync: updateTradeSetup, isPending } = useUpdateTradeSetup({
    onSuccess: () => {
      navigate({ to: "/trade_onboarding/add_tags", search });
    },
  });

  async function handleSubmit() {
    await updateTradeSetup({
      id: search.tradeSetupId as Id<"trade_setups">,
      snapshotId: search.snapshotId as Id<"snapshots">,
      trade_template: template._id as Id<"trade_templates">,
    });
  }

  const updatedAt = new Date(template.updatedAt);

  return (
    <div
      className={clsx(
        "flex items-center gap-3 p-2 w-full",
        isPending && "opacity-50 pointer-events-none"
      )}
      onClick={handleSubmit}
    >
      {/* Image thumbnail */}
      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
        {drawingData?.url ? (
          <img
            src={drawingData.url}
            alt={template.title}
            className="w-full h-full object-contain"
          />
        ) : (
          <ImageIcon className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm line-clamp-1 mb-1">
          {template.title}
        </h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <CalendarIcon className="w-3 h-3 mr-1" />
          <span>{formatDistanceToNow(updatedAt, { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
}
