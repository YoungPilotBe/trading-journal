import type { TreeNodeConfig } from "../tree.utils.new";
import { constructNode } from "../utils/node-creators";

/**
 * Fixed Range Confluence children
 */
export const createFixedRangeConfluenceChildren = (): TreeNodeConfig[] => [
  constructNode("vah", "VAH"),
  constructNode("poc", "POC"),
  constructNode("val", "VAL"),
];
