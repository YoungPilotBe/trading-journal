import { Doc } from "convex/_generated/dataModel";
import type { Timeframe } from "../../config/timeframe-order";
import type { StrategyFactory, TreeNode } from "../tree.utils";
import { closedStrategyTree } from "./closed.constants";
import { executedStrategyTree } from "./executed.constants";
import {
  createIdeaStrategyTree,
  ideaStrategyTree,
  type IdeaStrategyConfig,
} from "./idea.constants";
import { reviewedStrategyTree } from "./reviewed.constants";
import { watchingStrategyTree } from "./watching.constants";

// Map of status to strategy trees
export const strategyTreeMap: Record<Doc<"snapshots">["status"], TreeNode[]> = {
  idea: ideaStrategyTree,
  watching: ideaStrategyTree,
  executed: ideaStrategyTree,
  closed: ideaStrategyTree,
  reviewed: ideaStrategyTree,
  canceled: ideaStrategyTree,
};

/**
 * Helper function to get strategy factory by status
 * Returns a factory function that can be used with TreeProvider's strategyFactory prop
 *
 * @param status - The trade status (currently unused, reserved for future use)
 */
export const getStrategyFactory = (
  status: Doc<"snapshots">["status"]
): StrategyFactory<IdeaStrategyConfig> => {
  // Validate status is a known type
  const validStatuses: Doc<"snapshots">["status"][] = [
    "idea",
    "watching",
    "executed",
    "closed",
    "reviewed",
    "canceled",
  ];
  if (!validStatuses.includes(status)) {
    console.warn(
      `Unknown trade status: ${status}, falling back to idea strategy`
    );
  }

  // For now, all statuses use the idea strategy factory
  // In the future, this could return different factories based on status
  return createIdeaStrategyTree;
};

/**
 * Helper function to get strategy tree by status with optional timeframes
 *
 * @deprecated Use TreeProvider with strategyFactory and strategyConfig instead
 * @example
 * ```tsx
 * <TreeProvider
 *   strategyFactory={getStrategyFactory(status)}
 *   strategyConfig={{ availableTimeframes }}
 * >
 *   <Tree />
 * </TreeProvider>
 * ```
 */
export const generateStrategy = (
  status: Doc<"snapshots">["status"],
  availableTimeframes?: Timeframe[]
): TreeNode[] => {
  // For "idea" status, use the dynamic factory function if timeframes are provided
  if (status === "idea" && availableTimeframes?.length) {
    return createIdeaStrategyTree({ availableTimeframes });
  }

  // Fall back to static tree for other statuses or when no timeframes provided
  return strategyTreeMap[status];
};

// Export all individual strategy trees for direct import if needed
export {
  closedStrategyTree,
  executedStrategyTree,
  ideaStrategyTree,
  reviewedStrategyTree,
  watchingStrategyTree,
};
