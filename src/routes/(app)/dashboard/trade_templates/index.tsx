import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDrawing } from "@/hooks/drawings/useGetDrawing";
import { useGetAllTradeTemplates } from "@/hooks/trade_templates/get_all_trade_templates";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { CalendarIcon, ImageIcon, PlusIcon } from "lucide-react";

export const Route = createFileRoute("/(app)/dashboard/trade_templates/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useGetAllTradeTemplates();

  const handleCreateNew = () => {
    navigate({
      to: "/dashboard/trade_templates/trade_template",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading trade templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Trade Templates
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your trading strategy templates
            </p>
          </div>
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-6">
            <div className="bg-card rounded-lg border p-4">
              <h3 className="font-semibold mb-4">Filters</h3>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  All Templates ({templates?.length || 0})
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  Recent
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  With Images
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {!templates || templates.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first trade template to get started
              </p>
              <Button
                onClick={handleCreateNew}
                className="flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {templates.map((template) => (
                <TemplateCard key={template._id} template={template} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: any }) {
  const { data: drawingData } = useGetDrawing({
    id: template.drawingId,
  });

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

  const title = getDocumentTitle(template.document);
  const updatedAt = new Date(template.updatedAt);

  return (
    <Link
      to="/dashboard/trade_templates/trade_template"
      search={{ templateId: template._id }}
      className="block"
    >
      <Card className="group hover:shadow-md transition-shadow duration-200 h-full">
        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
          {drawingData?.url ? (
            <img
              src={drawingData.url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="w-4 h-4 mr-1" />
            {formatDistanceToNow(updatedAt, { addSuffix: true })}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
