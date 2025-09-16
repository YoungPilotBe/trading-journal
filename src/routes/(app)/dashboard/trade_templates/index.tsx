import { DeleteTradeTemplateDialog } from "@/components/dialog/delete-trade-template-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetDrawing } from "@/hooks/drawings/useGetDrawing";
import { useDeleteTradeTemplate } from "@/hooks/trade_templates/delete_trade_template";
import { useGetTradeTemplates } from "@/hooks/trade_templates/use-get-trade-templates";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Doc } from "convex/_generated/dataModel";
import {
  ImageIcon,
  LinkIcon,
  MoreVerticalIcon,
  PlusIcon,
  TrashIcon,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/(app)/dashboard/trade_templates/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { data: templates, isLoading } = useGetTradeTemplates({ sortOrder });
  const [filterBy, setFilterBy] = useState<"all" | "with-images" | "recent">(
    "all"
  );

  const clearAllFilters = () => {
    setSortOrder("desc");
    setFilterBy("all");
  };

  const filteredAndSortedTemplates = useMemo(() => {
    if (!templates) return [];

    let filtered = [...templates];

    // Apply filters
    if (filterBy === "with-images") {
      filtered = filtered.filter((template) => template.drawingId);
    } else if (filterBy === "recent") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      filtered = filtered.filter(
        (template) => new Date(template.updatedAt) > oneWeekAgo
      );
    }

    return filtered;
  }, [templates, filterBy]);

  const handleCreateNew = () => {
    navigate({
      to: "/dashboard/trade_templates/trade_template",
    });
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        {/* Controls skeleton */}
        <div className="flex gap-4 items-center">
          <div className="w-32 h-7 bg-muted/20 rounded animate-pulse" />
          <div className="w-40 h-7 bg-muted/20 rounded animate-pulse" />
          <div className="w-8 h-7 bg-muted/20 rounded animate-pulse" />
        </div>
        {/* Cards skeleton */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="animate-pulse h-28 bg-background">
              <CardContent className="h-full bg-muted/20 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage your trading strategy templates
          </p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <Select
          value={filterBy}
          onValueChange={(value) => setFilterBy(value as typeof filterBy)}
        >
          <SelectTrigger className="w-32" variant="badge" size="small">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="with-images">With Images</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortOrder}
          onValueChange={(value) => setSortOrder(value as typeof sortOrder)}
        >
          <SelectTrigger className="w-40" variant="badge" size="small">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={clearAllFilters}
          className="h-7 w-7 shrink-0"
          title="Clear all filters"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      {!filteredAndSortedTemplates ||
      filteredAndSortedTemplates.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {templates?.length === 0
              ? "No templates yet"
              : "No templates match your filters"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {templates?.length === 0
              ? "Create your first trade template to get started"
              : "Try adjusting your filters or create a new template"}
          </p>
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <PlusIcon className="w-4 h-4" />
            Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedTemplates.map((template) => (
            <TemplateCard key={template._id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: Doc<"trade_templates"> }) {
  const { data: drawingData } = useGetDrawing({
    id: template.drawingId,
  });
  const { mutateAsync: deleteTemplate, isPending: isDeleting } =
    useDeleteTradeTemplate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(false);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    await deleteTemplate({ id: template._id });
    setShowDeleteDialog(false);
  };

  return (
    <Card className="relative bg-background border-2 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 group overflow-hidden">
      {/* 3-dot menu */}
      <div className="absolute top-2 right-2 z-20">
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-white/80"
          >
            <MoreVerticalIcon className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link
        to="/dashboard/trade_templates/trade_template"
        search={{ templateId: template._id }}
        className="group"
      >
        <CardContent className="h-full flex flex-col justify-center">
          <div className="h-24">
            {drawingData?.url ? (
              <img
                src={drawingData.url}
                alt={template.title}
                className="object-contain absolute inset-0 mask-b-from-0%"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center absolute inset-0">
                <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50" />
              </div>
            )}
          </div>
          <div className="space-y-2 z-10">
            {/* Template Title */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base leading-tight truncate">
                  {template.title}
                </h3>
              </div>
            </div>

            {/* Date */}
            <div className="flex justify-between items-center gap-2">
              <div className="text-xs text-muted-foreground font-mono">
                {new Date(template.updatedAt).toLocaleDateString()}
              </div>

              <div className="text-xs text-muted-foreground font-mono flex flex-row gap-1 items-center">
                <LinkIcon className="size-3" />
                {template.tradeSetupIds?.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Link>

      <DeleteTradeTemplateDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        template={template}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </Card>
  );
}
