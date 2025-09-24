import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { statusOptions } from "@/config/constants";
import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { useGetTradeSetupBySnapshotId } from "@/hooks/trade-setup/use-get-trade-setup-by-image-id";
import { strategyTree } from "@/tree/tree.constants";
import { findNodeByKeyArray, findNodePathArray } from "@/tree/tree.utils";
import { Link, useSearch } from "@tanstack/react-router";
import clsx from "clsx";
import { Id } from "convex/_generated/dataModel";
import { BarChart3, ChevronRight, ChevronRightIcon } from "lucide-react";
import { Separator } from "../ui/separator";

interface TagsComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSnapshotId: Id<"snapshots">;
  targetSnapshotId: Id<"snapshots">;
  similarityPercentage: number;
}

export function TagsComparisonDialog({
  open,
  onOpenChange,
  currentSnapshotId,
  targetSnapshotId,
  similarityPercentage,
}: TagsComparisonDialogProps) {
  // Get current route search params to check if this matches the current trade setup
  const routeSearch = useSearch({ from: "/(app)/dashboard/setup" });
  const { data: currentSnapshot } = useGetSnapshot({
    id: currentSnapshotId,
  });
  const { data: currentTradeSetup } = useGetTradeSetupBySnapshotId({
    snapshotId: currentSnapshotId,
  });

  const { data: targetSnapshot } = useGetSnapshot({
    id: targetSnapshotId,
  });
  const { data: targetTradeSetup } = useGetTradeSetupBySnapshotId({
    snapshotId: targetSnapshotId,
  });

  // Extract tag arrays from snapshots
  const getCurrentTags = (): string[] => {
    if (!currentSnapshot?.tags) return [];
    if (Array.isArray(currentSnapshot.tags)) return currentSnapshot.tags;
    // If tags is an object, extract keys recursively
    return extractTagsFromObject(currentSnapshot.tags);
  };

  const getTargetTags = (): string[] => {
    if (!targetSnapshot?.tags) return [];
    if (Array.isArray(targetSnapshot.tags)) return targetSnapshot.tags;
    // If tags is an object, extract keys recursively
    return extractTagsFromObject(targetSnapshot.tags);
  };

  // Helper function to extract tags from nested object structure
  const extractTagsFromObject = (obj: unknown): string[] => {
    const tags: string[] = [];

    const traverse = (current: unknown) => {
      if (typeof current === "object" && current !== null) {
        Object.entries(current).forEach(([key, value]) => {
          if (value === true) {
            tags.push(key);
          } else if (typeof value === "object") {
            traverse(value);
          }
        });
      }
    };

    traverse(obj);
    return tags;
  };

  const currentTags = getCurrentTags();
  const targetTags = getTargetTags();

  // Find common and unique tags
  const commonTags = currentTags.filter((tag) => targetTags.includes(tag));
  const currentOnlyTags = currentTags.filter(
    (tag) => !targetTags.includes(tag)
  );
  const targetOnlyTags = targetTags.filter((tag) => !currentTags.includes(tag));

  // Get path information for a tag
  const getTagPathInfo = (tagKey: string) => {
    const path = findNodePathArray(strategyTree, tagKey);
    const pathNodes = path.map((key) => {
      const node = findNodeByKeyArray(strategyTree, key);
      return {
        key,
        icon: node?.icon || BarChart3,
        iconClassName: node?.iconClassName || "",
        title: node?.title || key.replace(/_/g, " "),
      };
    });

    return {
      path: pathNodes,
      leafNode: pathNodes[pathNodes.length - 1],
    };
  };

  // Render a tag item with its path
  const renderTagItem = (tagKey: string, isCommon: boolean) => {
    const { path } = getTagPathInfo(tagKey);

    return (
      <div
        key={tagKey}
        className={`flex  gap-2 p-3 rounded-lg border ${
          isCommon
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
            : "border-muted bg-muted/20 text-muted-foreground"
        }`}
      >
        {/* Render the path with breadcrumb-style navigation */}
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {path.map((node, index) => {
            const IconComponent = node.icon;
            const isLast = index === path.length - 1;

            return (
              <div key={node.key} className="flex items-center gap-1">
                {/* Node icon and title */}
                <div className="flex items-center gap-1 min-w-0">
                  <IconComponent
                    className={`w-3.5 h-3.5 flex-shrink-0 ${node.iconClassName} ${
                      isLast ? "opacity-100" : "opacity-60"
                    }`}
                  />
                  <span
                    className={`text-xs font-mono truncate ${
                      isLast ? "font-medium" : "opacity-75"
                    }`}
                    title={node.title}
                  >
                    {node.title}
                  </span>
                </div>

                {/* Separator (not for the last item) */}
                {!isLast && (
                  <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-40" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] h-[60vh] max-h-[85vh] overflow-y-auto flex flex-col justify-start">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-left">Tags Comparison</DialogTitle>
              <DialogDescription className="text-left">
                Comparing tags between snapshots •{" "}
                {Math.round(similarityPercentage * 100)}% similarity
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator className="mb-7" />

        <div className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Current Snapshot Tags */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 text-sm">
                  <Button
                    variant="outline"
                    size="badge"
                    className={clsx(
                      "text-[11px] justify-between hover:bg-accent hover:text-accent-foreground group-hover:[&:not(:has(.chevron-link:hover))]:bg-accent group-hover:[&:not(:has(.chevron-link:hover))]:text-accent-foreground group-[.chevron-hovered]:bg-transparent group-[.chevron-hovered]:text-inherit transition-colors gap-1",
                      {
                        "!bg-emerald-500/10 !border-emerald-500/50 !text-emerald-700 dark:!text-emerald-400 hover:!bg-emerald-500/20":
                          routeSearch.tradeSetupId === currentTradeSetup?._id,
                      }
                    )}
                  >
                    {currentTradeSetup?.title}
                    <Link
                      to={"/dashboard/setup"}
                      search={{
                        tradeSetupId:
                          currentTradeSetup?._id as Id<"trade_setups">,
                        snapshotId: currentSnapshotId as Id<"snapshots">,
                      }}
                      className="rounded text-inherit transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ChevronRightIcon className="size-4 text-inherit" />
                    </Link>
                  </Button>

                  <span
                    className={`px-1 py-0.5 border font-mono text-xs rounded-sm transition-all ${
                      statusOptions.find(
                        (option) => option.value === currentSnapshot?.status
                      )?.color ||
                      "border-muted bg-muted/20 text-muted-foreground"
                    }`}
                  >
                    {currentSnapshot?.status || "unknown"}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {currentTradeSetup?.asset || "N/A"}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {currentTags.length} tags
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {/* Common tags first */}
                {currentTags
                  .filter((tag) => commonTags.includes(tag))
                  .map((tag) => renderTagItem(tag, true))}

                {/* Current-only tags */}
                {currentOnlyTags.map((tag) => renderTagItem(tag, false))}

                {currentTags.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No tags found
                  </div>
                )}
              </div>
            </div>

            {/* Target Snapshot Tags */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 text-sm">
                  <Button
                    variant="outline"
                    size="badge"
                    className={clsx(
                      "text-[11px] justify-between hover:bg-accent hover:text-accent-foreground group-hover:[&:not(:has(.chevron-link:hover))]:bg-accent group-hover:[&:not(:has(.chevron-link:hover))]:text-accent-foreground group-[.chevron-hovered]:bg-transparent group-[.chevron-hovered]:text-inherit transition-colors gap-1",
                      {
                        "!bg-emerald-500/10 !border-emerald-500/50 !text-emerald-700 dark:!text-emerald-400 hover:!bg-emerald-500/20":
                          routeSearch.tradeSetupId === targetTradeSetup?._id,
                      }
                    )}
                  >
                    {targetTradeSetup?.title}
                    <Link
                      to={"/dashboard/setup"}
                      search={{
                        tradeSetupId:
                          targetTradeSetup?._id as Id<"trade_setups">,
                        snapshotId: targetSnapshotId as Id<"snapshots">,
                      }}
                      className="rounded text-inherit transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ChevronRightIcon className="size-4 text-inherit" />
                    </Link>
                  </Button>

                  <span
                    className={`px-1 py-0.5 border font-mono text-xs rounded-sm transition-all ${
                      statusOptions.find(
                        (option) => option.value === targetSnapshot?.status
                      )?.color ||
                      "border-muted bg-muted/20 text-muted-foreground"
                    }`}
                  >
                    {targetSnapshot?.status || "unknown"}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {targetTradeSetup?.asset || "N/A"}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {targetTags.length} tags
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {/* Common tags first */}
                {targetTags
                  .filter((tag) => commonTags.includes(tag))
                  .map((tag) => renderTagItem(tag, true))}

                {/* Target-only tags */}
                {targetOnlyTags.map((tag) => renderTagItem(tag, false))}

                {targetTags.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No tags found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
