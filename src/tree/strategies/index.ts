import type { TreeNode } from "../tree.utils";
import { closedStrategyTree } from "./closed.constants";
import { executedStrategyTree } from "./executed.constants";
import { ideaStrategyTree } from "./idea.constants";
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
  watching: watchingStrategyTree,
  executed: executedStrategyTree,
  closed: closedStrategyTree,
  reviewed: reviewedStrategyTree,
};

// Helper function to get strategy tree by status
export const generateStrategy = (status: TradeStatus): TreeNode[] => {
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
