import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { strategyTree } from "@/tree/tree.constants";
import { findNodeByKeyArray, findNodePathArray } from "@/tree/tree.utils";
import { Id } from "convex/_generated/dataModel";
import { BarChart3, ChevronRight, X } from "lucide-react";

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
  const { data: currentSnapshot } = useGetSnapshot({
    id: currentSnapshotId,
  });

  const { data: targetSnapshot } = useGetSnapshot({
    id: targetSnapshotId,
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
        className={`flex items-center gap-1 p-3 rounded-lg border ${
          isCommon
            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
            : "border-muted bg-muted/20 text-muted-foreground"
        }`}
      >
        {/* Render the path with breadcrumb-style navigation */}
        <div className="flex items-center gap-1 flex-wrap min-w-0">
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
      <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-y-auto">
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

        <div className="space-y-6">
          {/* Similarity Score */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-sm">Tags Similarity Score</div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${similarityPercentage * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-medium">
                  {Math.round(similarityPercentage * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Current Snapshot Tags */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="font-medium text-sm">Current Snapshot</h3>
                <span className="text-xs text-muted-foreground font-mono">
                  ({currentTags.length} tags)
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
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
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <h3 className="font-medium text-sm">Target Snapshot</h3>
                <span className="text-xs text-muted-foreground font-mono">
                  ({targetTags.length} tags)
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
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

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-mono font-semibold text-emerald-600">
                {commonTags.length}
              </div>
              <div className="text-xs text-muted-foreground">Common</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono font-semibold text-blue-600">
                {currentOnlyTags.length}
              </div>
              <div className="text-xs text-muted-foreground">Current Only</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-mono font-semibold text-purple-600">
                {targetOnlyTags.length}
              </div>
              <div className="text-xs text-muted-foreground">Target Only</div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
