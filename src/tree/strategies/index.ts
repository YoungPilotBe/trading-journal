import type { Timeframe } from "../../config/timeframe-order";
import type { TreeNode } from "../tree.utils";
import { closedStrategyTree } from "./closed.constants";
import { executedStrategyTree } from "./executed.constants";
import { createIdeaStrategyTree, ideaStrategyTree } from "./idea.constants";
import { reviewedStrategyTree } from "./reviewed.constants";
import { watchingStrategyTree } from "./watching.constants";

// Status types from the schema
export type TradeStatus =
  | "idea"
  | "watching"
  | "executed"
  | "closed"
  | "reviewed";

// Map of status to strategy trees
export const strategyTreeMap: Record<TradeStatus, TreeNode[]> = {
  idea: ideaStrategyTree,
  watching: ideaStrategyTree,
  executed: ideaStrategyTree,
  closed: ideaStrategyTree,
  reviewed: ideaStrategyTree,
};

// Helper function to get strategy tree by status with optional timeframes
export const generateStrategy = (
  status: TradeStatus,
  availableTimeframes?: Timeframe[]
): TreeNode[] => {
  // For "idea" status, use the dynamic factory function if timeframes are provided
  if (status === "idea" && availableTimeframes?.length) {
    return createIdeaStrategyTree(availableTimeframes);
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
