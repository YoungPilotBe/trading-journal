import { Timeframe } from "@/config/timeframe-order";
import { Doc } from "convex/_generated/dataModel";
import { Clock, LucideIcon } from "lucide-react";
import { z } from "zod";

// Custom value transformation function type
export type CustomValueTransform = (rawValue: unknown) => unknown;

// Input field configuration type
export type InputFieldConfig = {
  schema: z.ZodSchema<unknown>; // Zod schema for validation
  placeholder?: string;
  custom?: Array<{
    key: string; // The property name in the final object
    transform: CustomValueTransform; // Function to transform rawValue
  }>;
};

export type TreeNode = {
  key: string;
  title: string;
  children?: TreeNode[];
  anti?: string[]; // Keys that should be deselected when this item is selected
  icon?: LucideIcon; // Lucide React icon component
  iconClassName?: string; // CSS classes for the icon
  isDir?: boolean; // Whether this node should be rendered as a directory
  inputField?: InputFieldConfig; // Configuration for input field
};

function getTreeDepth(tree: TreeNode): number {
  if (!tree.children || tree.children.length === 0) {
    return 1;
  }

  let maxChildDepth = 0;
  for (const child of tree.children) {
    const childDepth = getTreeDepth(child);
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }

  return maxChildDepth + 1;
}

export type GridCell = {
  content: string;
  level: number;
  rowIndex: number;
  nodeKey: string;
  hasChildren: boolean;
  isExpanded?: boolean;
  isLeaf: boolean;
  isSelected?: boolean;
  icon?: LucideIcon;
  iconClassName?: string;
  isDir?: boolean;
  inputField?: InputFieldConfig;
  parentKey?: string; // Key of the parent node (for input fields)
};

function flattenTreeToGrid(
  tree: TreeNode,
  expandedKeys: Set<string> = new Set(),
  selectedNodes: Set<string> = new Set()
): GridCell[][] {
  const rows: GridCell[][] = [];
  const maxDepth = getTreeDepth(tree) + 1; // +1 to account for input fields

  function processNode(
    node: TreeNode,
    level: number,
    rowIndex: number,
    parentKey?: string
  ): number {
    if (!rows[rowIndex]) {
      rows[rowIndex] = new Array(maxDepth).fill(null);
    }

    const hasChildren = Boolean(node.children?.length);
    const isExpanded = expandedKeys.has(node.key);
    const isLeaf = !hasChildren;
    const isSelected = selectedNodes.has(node.key);

    rows[rowIndex][level] = {
      content: node.title,
      level,
      rowIndex,
      nodeKey: node.key,
      hasChildren,
      isExpanded,
      isLeaf,
      isSelected,
      icon: node.icon,
      iconClassName: node.iconClassName,
      isDir:
        node.isDir || node.title.includes("_+_") || node.key.includes("_+_"),
      parentKey,
    };

    let currentRowIndex = rowIndex;

    if (hasChildren && isExpanded) {
      for (let i = 0; i < node.children!.length; i++) {
        const child = node.children![i];
        currentRowIndex = processNode(
          child,
          level + 1,
          currentRowIndex,
          node.key
        );
        if (i < node.children!.length - 1) {
          currentRowIndex++;
        }
      }
    }

    // If node has an input field and is selected (leaf node), add input field in the next column
    if (node.inputField && isSelected && isLeaf && level + 1 < maxDepth) {
      console.log(
        `Creating input field for node: ${node.key}, level: ${level}, maxDepth: ${maxDepth}`
      );
      if (!rows[rowIndex]) {
        rows[rowIndex] = new Array(maxDepth).fill(null);
      }

      rows[rowIndex][level + 1] = {
        content: "", // Empty content for input field
        level: level + 1,
        rowIndex,
        nodeKey: `${node.key}_input`,
        hasChildren: false,
        isExpanded: false,
        isLeaf: true,
        isSelected: false,
        inputField: node.inputField,
        parentKey: node.key,
      };
    }

    return currentRowIndex;
  }

  processNode(tree, 0, 0);
  return rows;
}

function findNodePath(tree: TreeNode, targetKey: string): string[] {
  function search(node: TreeNode, path: string[]): string[] | null {
    const currentPath = [...path, node.key];

    if (node.key === targetKey) {
      return currentPath;
    }

    if (node.children) {
      for (const child of node.children) {
        const result = search(child, currentPath);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  return search(tree, []) || [];
}

function getNodeAntiKeys(tree: TreeNode, nodeKey: string): string[] {
  function search(node: TreeNode): string[] | null {
    if (node.key === nodeKey) {
      return node.anti || [];
    }

    if (node.children) {
      for (const child of node.children) {
        const result = search(child);
        if (result !== null) {
          return result;
        }
      }
    }

    return null;
  }

  return search(tree) || [];
}

function getAllDescendantKeys(node: TreeNode): string[] {
  const descendants: string[] = [];

  function collect(currentNode: TreeNode) {
    if (currentNode.children) {
      for (const child of currentNode.children) {
        descendants.push(child.key);
        collect(child);
      }
    }
  }

  collect(node);
  return descendants;
}

function findNodeByKey(tree: TreeNode, nodeKey: string): TreeNode | null {
  if (tree.key === nodeKey) {
    return tree;
  }

  if (tree.children) {
    for (const child of tree.children) {
      const result = findNodeByKey(child, nodeKey);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

function toggleNodeWithAntiSelection(
  tree: TreeNode,
  selectedNodes: Set<string>,
  nodeKey: string
): Set<string> {
  const newSelectedNodes = new Set(selectedNodes);

  if (newSelectedNodes.has(nodeKey)) {
    newSelectedNodes.delete(nodeKey);
  } else {
    newSelectedNodes.add(nodeKey);

    // Handle anti-selection logic
    const antiKeys = getNodeAntiKeys(tree, nodeKey);
    antiKeys.forEach((antiKey) => {
      newSelectedNodes.delete(antiKey);

      // If the anti item is a branch, also deselect all its descendants
      const antiNode = findNodeByKey(tree, antiKey);
      if (antiNode?.children) {
        const descendantKeys = getAllDescendantKeys(antiNode);
        descendantKeys.forEach((descendantKey) => {
          newSelectedNodes.delete(descendantKey);
        });
      }
    });
  }

  return newSelectedNodes;
}

function toggleLeafWithAntiSelection(
  tree: TreeNode,
  selectedNodes: Set<string>,
  nodeKey: string
): Set<string> {
  return toggleNodeWithAntiSelection(tree, selectedNodes, nodeKey);
}

function toggleBranchWithAntiSelection(
  tree: TreeNode,
  selectedNodes: Set<string>,
  expandedKeys: Set<string>,
  nodeKey: string
): { selectedNodes: Set<string>; expandedKeys: Set<string> } {
  const newSelectedNodes = new Set(selectedNodes);
  const newExpandedKeys = new Set(expandedKeys);

  const node = findNodeByKey(tree, nodeKey);
  if (!node) {
    return { selectedNodes: newSelectedNodes, expandedKeys: newExpandedKeys };
  }

  const wasSelected = newSelectedNodes.has(nodeKey);

  if (wasSelected) {
    // Deselect and collapse
    newSelectedNodes.delete(nodeKey);
    newExpandedKeys.delete(nodeKey);

    // Also collapse and deselect all descendants
    const descendantKeys = getAllDescendantKeys(node);
    descendantKeys.forEach((descendantKey) => {
      newSelectedNodes.delete(descendantKey);
      newExpandedKeys.delete(descendantKey);
    });
  } else {
    // Select and handle anti-logic
    newSelectedNodes.add(nodeKey);

    // Handle anti-selection
    const antiKeys = getNodeAntiKeys(tree, nodeKey);
    antiKeys.forEach((antiKey) => {
      newSelectedNodes.delete(antiKey);
      newExpandedKeys.delete(antiKey);

      const antiNode = findNodeByKey(tree, antiKey);
      if (antiNode?.children) {
        const descendantKeys = getAllDescendantKeys(antiNode);
        descendantKeys.forEach((descendantKey) => {
          newSelectedNodes.delete(descendantKey);
          newExpandedKeys.delete(descendantKey);
        });
      }
    });

    // Expand if has children
    if (node.children?.length) {
      newExpandedKeys.add(nodeKey);
    }
  }

  return { selectedNodes: newSelectedNodes, expandedKeys: newExpandedKeys };
}

function toggleBranchExpansion(
  tree: TreeNode,
  selectedNodes: Set<string>,
  expandedKeys: Set<string>,
  nodeKey: string
): { selectedNodes: Set<string>; expandedKeys: Set<string> } {
  const newSelectedNodes = new Set(selectedNodes);
  const newExpandedKeys = new Set(expandedKeys);

  const node = findNodeByKey(tree, nodeKey);
  if (!node) {
    return { selectedNodes: newSelectedNodes, expandedKeys: newExpandedKeys };
  }

  // Toggle expansion
  if (newExpandedKeys.has(nodeKey)) {
    newExpandedKeys.delete(nodeKey);

    // When collapsing, deselect all descendants
    const descendantKeys = getAllDescendantKeys(node);
    descendantKeys.forEach((descendantKey) => {
      newSelectedNodes.delete(descendantKey);
      newExpandedKeys.delete(descendantKey);
    });
  } else {
    newExpandedKeys.add(nodeKey);
  }

  return { selectedNodes: newSelectedNodes, expandedKeys: newExpandedKeys };
}

function convertSelectionToJson(
  tree: TreeNode,
  selectedNodes: Set<string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  selectedNodes.forEach((nodeKey) => {
    const path = findNodePath(tree, nodeKey);
    if (path.length > 0) {
      // Remove the root from the path
      const pathWithoutRoot = path.slice(1);

      if (pathWithoutRoot.length > 0) {
        // Build nested object structure
        let current: Record<string, unknown> = result;

        // Navigate/create the nested structure
        for (let i = 0; i < pathWithoutRoot.length - 1; i++) {
          const segment = pathWithoutRoot[i];

          // If the current segment is already set to true (boolean),
          // we need to convert it to an object to add children
          if (current[segment] === true) {
            current[segment] = {};
          } else if (
            !current[segment] ||
            typeof current[segment] !== "object"
          ) {
            current[segment] = {};
          }

          current = current[segment] as Record<string, unknown>;
        }

        // Set the final node to true
        const nodeName = pathWithoutRoot[pathWithoutRoot.length - 1];
        current[nodeName] = true;
      }
    }
  });

  return result;
}

// Wrapper functions to handle arrays of TreeNodes
function getTreeDepthArray(trees: TreeNode[]): number {
  if (trees.length === 0) return 1;

  let maxDepth = 0;
  for (const tree of trees) {
    const depth = getTreeDepth(tree);
    maxDepth = Math.max(maxDepth, depth);
  }

  return maxDepth;
}

function flattenTreeArrayToGrid(
  trees: TreeNode[],
  expandedKeys: Set<string> = new Set(),
  selectedNodes: Set<string> = new Set()
): GridCell[][] {
  const allRows: GridCell[][] = [];
  const maxDepth = getTreeDepthArray(trees); // +1 to account for input fields

  let currentRowIndex = 0;

  for (let treeIndex = 0; treeIndex < trees.length; treeIndex++) {
    const tree = trees[treeIndex];
    const treeRows = flattenTreeToGrid(tree, expandedKeys, selectedNodes);

    // Adjust row indices for the combined grid
    treeRows.forEach((row) => {
      const adjustedRow = new Array(maxDepth).fill(null);
      row.forEach((cell, colIndex) => {
        if (cell) {
          adjustedRow[colIndex] = {
            ...cell,
            rowIndex: currentRowIndex,
          };
        }
      });
      allRows.push(adjustedRow);
      currentRowIndex++;
    });
  }

  return allRows;
}

function findNodeByKeyArray(
  trees: TreeNode[],
  nodeKey: string
): TreeNode | null {
  for (const tree of trees) {
    const result = findNodeByKey(tree, nodeKey);
    if (result) {
      return result;
    }
  }
  return null;
}

function findNodePathArray(trees: TreeNode[], targetKey: string): string[] {
  for (const tree of trees) {
    const path = findNodePath(tree, targetKey);
    if (path.length > 0) {
      // Remove the root from the path since we're working with arrays
      return path.slice(1);
    }
  }
  return [targetKey]; // Fallback if not found
}

/**
 * Sets a value at a nested path in an object, creating intermediate objects as needed
 * @param obj - The target object to modify
 * @param path - Array of keys representing the path to the target location
 * @param value - The value to set at the target location
 * @param merge - Whether to merge with existing value (default: true)
 */
function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: Record<string, unknown>,
  merge: boolean = true
): void {
  let current = obj;

  // Navigate to the correct nested path
  for (let i = 0; i < path.length; i++) {
    const pathPart = path[i];

    if (!current[pathPart]) {
      current[pathPart] = {};
    }

    // If this is the last part, we're at the target node
    if (i === path.length - 1) {
      if (merge) {
        // Merge the value with any existing data for this node
        current[pathPart] = {
          ...((current[pathPart] as Record<string, unknown>) || {}),
          ...value,
        };
      } else {
        // Replace the existing value
        current[pathPart] = value;
      }
    } else {
      current = current[pathPart] as Record<string, unknown>;
    }
  }
}

/**
 * Gets a value at a nested path in an object
 * @param obj - The source object to read from
 * @param path - Array of keys representing the path to the target location
 * @returns The value at the path, or undefined if not found
 */
function getNestedValue(
  obj: Record<string, unknown>,
  path: string[]
): Record<string, unknown> | undefined {
  let current = obj;

  // Navigate to the correct nested path
  for (let i = 0; i < path.length; i++) {
    const pathPart = path[i];

    if (!current[pathPart]) {
      return undefined;
    }

    if (i === path.length - 1) {
      // Return the value at the target location
      return current[pathPart] as Record<string, unknown>;
    } else {
      current = current[pathPart] as Record<string, unknown>;
    }
  }

  return undefined;
}

function convertSelectionToJsonArray(
  trees: TreeNode[],
  selectedNodes: Set<string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const tree of trees) {
    const treeResult = convertSelectionToJson(tree, selectedNodes);
    Object.assign(result, treeResult);
  }

  return result;
}

function toggleBranchWithAntiSelectionArray(
  trees: TreeNode[],
  selectedNodes: Set<string>,
  expandedKeys: Set<string>,
  nodeKey: string
): { selectedNodes: Set<string>; expandedKeys: Set<string> } {
  for (const tree of trees) {
    const node = findNodeByKey(tree, nodeKey);
    if (node) {
      return toggleBranchWithAntiSelection(
        tree,
        selectedNodes,
        expandedKeys,
        nodeKey
      );
    }
  }
  return { selectedNodes, expandedKeys };
}

function toggleBranchExpansionArray(
  trees: TreeNode[],
  selectedNodes: Set<string>,
  expandedKeys: Set<string>,
  nodeKey: string
): { selectedNodes: Set<string>; expandedKeys: Set<string> } {
  for (const tree of trees) {
    const node = findNodeByKey(tree, nodeKey);
    if (node) {
      return toggleBranchExpansion(tree, selectedNodes, expandedKeys, nodeKey);
    }
  }
  return { selectedNodes, expandedKeys };
}

function toggleLeafWithAntiSelectionArray(
  trees: TreeNode[],
  selectedNodes: Set<string>,
  nodeKey: string
): Set<string> {
  for (const tree of trees) {
    const node = findNodeByKey(tree, nodeKey);
    if (node) {
      return toggleLeafWithAntiSelection(tree, selectedNodes, nodeKey);
    }
  }
  return selectedNodes;
}

// Unified toggle function that handles both branches and leaves
function toggleNodeArray(
  trees: TreeNode[],
  selectedNodes: Set<string>,
  expandedKeys: Set<string>,
  nodeKey: string,
  isBranch: boolean,
  hasAntiSelection: boolean
): { selectedNodes: Set<string>; expandedKeys: Set<string> } {
  if (hasAntiSelection) {
    // Use anti-selection logic for both branches and leaves
    return toggleBranchWithAntiSelectionArray(
      trees,
      selectedNodes,
      expandedKeys,
      nodeKey
    );
  } else if (isBranch) {
    // Regular branch expansion without anti-selection
    return toggleBranchExpansionArray(
      trees,
      selectedNodes,
      expandedKeys,
      nodeKey
    );
  } else {
    // Regular leaf toggle without anti-selection
    const newSelectedNodes = toggleLeafWithAntiSelectionArray(
      trees,
      selectedNodes,
      nodeKey
    );
    return { selectedNodes: newSelectedNodes, expandedKeys };
  }
}

function createTreeStateFromSnapshot(
  snapshot: Doc<"snapshots">,
  previousSnapshot?: Doc<"snapshots"> | null
) {
  // If no tags exist in current snapshot, use previous snapshot for tree state
  if (!snapshot.tags || Object.keys(snapshot.tags).length === 0) {
    if (previousSnapshot?.tags_config) {
      return {
        expandedKeys: new Set<string>(
          previousSnapshot.tags_config.expandedKeys || ["strategy"]
        ),
        selectedNodes: new Set<string>(
          previousSnapshot.tags_config.selectedNodes || []
        ),
        tags: previousSnapshot.tags || {},
      };
    }
  }

  if (snapshot?.tags_config) {
    // Restore complete tree state from saved config
    return {
      expandedKeys: new Set<string>(
        snapshot.tags_config.expandedKeys || ["strategy"]
      ),
      selectedNodes: new Set<string>(snapshot.tags_config.selectedNodes || []),
      tags: snapshot.tags || {},
    };
  }

  // If no config exists but we have tags, create a default state
  return {
    expandedKeys: new Set<string>(["strategy"]),
    selectedNodes: new Set<string>(),
    tags: snapshot.tags,
  };
}

function mergeTagConfigs(
  config1?: { expandedKeys?: string[]; selectedNodes?: string[] },
  config2?: { expandedKeys?: string[]; selectedNodes?: string[] }
): { expandedKeys: Set<string>; selectedNodes: Set<string> } {
  const mergedExpandedKeys = new Set<string>([
    ...(config1?.expandedKeys || []),
    ...(config2?.expandedKeys || []),
  ]);

  const mergedSelectedNodes = new Set<string>([
    ...(config1?.selectedNodes || []),
    ...(config2?.selectedNodes || []),
  ]);

  return {
    expandedKeys: mergedExpandedKeys,
    selectedNodes: mergedSelectedNodes,
  };
}
// Create timeframe children for a given direction prefix
export const createTimeframeChildren = (
  directionPrefix: string,
  availableTimeframes: Timeframe[] = [],
  iconClassName?: string
): TreeNode[] => {
  return availableTimeframes.map((timeframe) => ({
    key: `${directionPrefix}_${timeframe}`,
    title: timeframe,
    icon: Clock,
    iconClassName: iconClassName || "text-muted-foreground",
    // Anti keys prevent selecting multiple timeframes across all directions
    anti: availableTimeframes
      .filter((tf) => tf !== timeframe)
      .flatMap((tf) => [
        // Remove the direction suffix to get the base prefix (swing, fractal, etc.)
        directionPrefix.replace(/_[^_]+$/, `_bullish_${tf}`),
        directionPrefix.replace(/_[^_]+$/, `_bearish_${tf}`),
      ]),
  }));
};

/**
 * Generic type for strategy factory functions that accept configuration
 * and return a tree node array.
 *
 * @template TConfig - The configuration object type (must extend Record<string, unknown>)
 *
 * @example
 * ```ts
 * // Define your config type
 * interface MyStrategyConfig {
 *   availableTimeframes: Timeframe[];
 *   showAdvanced: boolean;
 *   customSettings: { ... };
 * }
 *
 * // Use it in your factory
 * const createMyStrategy: StrategyFactory<MyStrategyConfig> = (config) => {
 *   // config is fully typed!
 *   const { availableTimeframes, showAdvanced } = config;
 *   return [...];
 * }
 * ```
 */
export type StrategyFactory<
  TConfig extends Record<string, unknown> = Record<string, unknown>,
> = (config: TConfig) => TreeNode[];

export {
  convertSelectionToJson,
  convertSelectionToJsonArray,
  createTreeStateFromSnapshot,
  findNodeByKey,
  findNodeByKeyArray,
  findNodePath,
  findNodePathArray,
  flattenTreeArrayToGrid,
  flattenTreeToGrid,
  getNestedValue,
  getTreeDepth,
  // Array wrapper functions
  getTreeDepthArray,
  mergeTagConfigs,
  setNestedValue,
  toggleBranchExpansion,
  toggleBranchExpansionArray,
  toggleBranchWithAntiSelection,
  toggleBranchWithAntiSelectionArray,
  toggleLeafWithAntiSelection,
  toggleLeafWithAntiSelectionArray,
  toggleNodeArray,
};
