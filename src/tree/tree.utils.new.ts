/**
 * Tree Utilities - Helper functions and factories for working with TreeNode classes
 *
 * This module provides:
 * - Factory functions for creating common tree patterns
 * - Snapshot conversion utilities
 * - Type definitions for strategy factories
 */

import type { Timeframe } from "@/config/timeframe-order";
import { Doc } from "convex/_generated/dataModel";
import { Clock, type LucideIcon } from "lucide-react";
import { TreeNode, type TreeNodeConfig } from "./TreeNode.class";
import type { ITreeState } from "./TreeState.class";

// Re-export types for convenience
export type {
  CustomValueTransform,
  InputFieldConfig,
  TreeNodeConfig,
  TreeNodeMetadata,
} from "./TreeNode.class";

export { TreeGrid, type GridCell } from "./TreeGrid.class";
export { TreeNode } from "./TreeNode.class";
export { TreeState, type ITreeState } from "./TreeState.class";

/**
 * Configuration interface for creating timeframe nodes
 */
export interface TimeframeNodeConfig {
  prefix: string;
  availableTimeframes: string[];
  createChildren: (timeframePrefix: string) => TreeNodeConfig[];
  generateAntiKeys?: (timeframe: string, allTimeframes: string[]) => string[];
  icon?: LucideIcon;
  iconClassName?: string;
  preventMultipleSelection?: boolean;
}

/**
 * Generic type for strategy factory functions that accept configuration
 * and return a tree node array.
 */
export type StrategyFactory<
  TConfig extends Record<string, unknown> = Record<string, unknown>,
> = (config: TConfig) => TreeNode[];

// ========================================
// Factory Functions
// ========================================

/**
 * Create timeframe nodes with automatic anti-selection logic
 */
export const createTimeframeNodes = (
  config: TimeframeNodeConfig
): TreeNode[] => {
  const {
    prefix,
    availableTimeframes,
    createChildren,
    generateAntiKeys,
    preventMultipleSelection = true,
  } = config;

  if (availableTimeframes.length === 0) {
    return [];
  }

  return availableTimeframes.map((timeframe) => {
    const timeframePrefix = `${prefix}_${timeframe}`;

    // Generate anti keys
    const antiKeys = preventMultipleSelection
      ? generateAntiKeys
        ? generateAntiKeys(timeframe, availableTimeframes)
        : availableTimeframes
            .filter((tf) => tf !== timeframe)
            .map((tf) => `${prefix}_${tf}`)
      : [];

    const childrenConfigs = createChildren(timeframePrefix);

    return new TreeNode({
      key: timeframePrefix,
      title: timeframe,
      metadata: {
        anti: antiKeys,
        isTimeframe: true,
      },
      children: childrenConfigs.map((config) => new TreeNode(config)),
    });
  });
};

/**
 * Create timeframe children for a given direction prefix
 */
export const createTimeframeChildren = (
  directionPrefix: string,
  availableTimeframes: Timeframe[] = [],
  iconClassName?: string
): TreeNode[] => {
  return availableTimeframes.map((timeframe) => {
    const antiKeys = availableTimeframes
      .filter((tf) => tf !== timeframe)
      .flatMap((tf) => [
        directionPrefix.replace(/_[^_]+$/, `_bullish_${tf}`),
        directionPrefix.replace(/_[^_]+$/, `_bearish_${tf}`),
      ]);

    return new TreeNode({
      key: `${directionPrefix}_${timeframe}`,
      title: timeframe,
      metadata: {
        icon: Clock,
        iconClassName: iconClassName || "text-muted-foreground",
        anti: antiKeys,
      },
    });
  });
};

/**
 * Helper to build a TreeNode from a config object
 * Useful for converting from old TreeNodeConfig format
 */
export const buildTreeNode = (config: TreeNodeConfig): TreeNode => {
  return new TreeNode(config);
};

/**
 * Helper to build multiple TreeNodes from config objects
 */
export const buildTreeNodes = (configs: TreeNodeConfig[]): TreeNode[] => {
  return configs.map((config) => buildTreeNode(config));
};

// ========================================
// Snapshot Conversion Utilities
// ========================================

/**
 * Create tree state from a snapshot document
 */
export function createTreeStateFromSnapshot(
  snapshot: Doc<"snapshots">,
  previousSnapshot?: Doc<"snapshots"> | null
): ITreeState {
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
    tags: snapshot.tags || {},
  };
}

/**
 * Merge two tag configs together
 */
export function mergeTagConfigs(
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

/**
 * Hydrate dynamic instances into the tree based on saved state
 *
 * This function detects dynamic instances from the saved keys (expandedKeys, selectedNodes, or tags)
 * and recreates them in the tree structure by cloning the template nodes.
 *
 * @param trees - The array of tree root nodes
 * @param treeState - The initial tree state from the snapshot
 * @returns The trees with dynamic instances hydrated
 */
export function hydrateDynamicInstances(
  trees: TreeNode[],
  treeState: ITreeState
): TreeNode[] {
  // Collect all keys from the state
  const allKeys = new Set<string>([
    ...treeState.expandedKeys,
    ...treeState.selectedNodes,
  ]);

  // Also extract keys from tags object
  const extractKeysFromTags = (
    obj: Record<string, unknown>,
    prefix = ""
  ): void => {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}_${key}` : key;
      allKeys.add(fullKey);

      if (value && typeof value === "object" && !Array.isArray(value)) {
        extractKeysFromTags(value as Record<string, unknown>, fullKey);
      }
    }
  };
  extractKeysFromTags(treeState.tags);

  // Find all dynamic instance patterns (keys containing _#N)
  const dynamicInstancePattern = /_#(\d+)(?:_|$)/;
  const instanceMap = new Map<string, Set<number>>(); // templateKey -> Set of instance numbers

  for (const key of allKeys) {
    const match = key.match(dynamicInstancePattern);
    if (match) {
      const instanceNumber = parseInt(match[1], 10);
      // Extract the template key by removing the _#N part and everything after
      const templateKey = key.substring(0, key.indexOf(`_#${instanceNumber}`));

      if (!instanceMap.has(templateKey)) {
        instanceMap.set(templateKey, new Set());
      }
      instanceMap.get(templateKey)!.add(instanceNumber);
    }
  }

  // If no dynamic instances found, return trees as-is
  if (instanceMap.size === 0) {
    return trees;
  }

  // For each dynamic instance, find the template and clone it
  for (const [templateKey, instanceNumbers] of instanceMap) {
    // Find the template node
    let templateNode: TreeNode | null = null;
    for (const tree of trees) {
      templateNode = tree.findNode(templateKey);
      if (templateNode) break;
    }

    if (!templateNode) {
      console.warn(`Template node not found for key: ${templateKey}`);
      continue;
    }

    if (!templateNode.metadata.isAddable) {
      console.warn(`Template node is not addable: ${templateKey}`);
      continue;
    }

    const parent = templateNode.parent;
    if (!parent) {
      console.warn(`Template node has no parent: ${templateKey}`);
      continue;
    }

    // Sort instance numbers to create them in order
    const sortedInstances = Array.from(instanceNumbers).sort((a, b) => a - b);

    // Create each missing instance
    for (const instanceNumber of sortedInstances) {
      const instanceKey = `${templateKey}_#${instanceNumber}`;

      // Check if instance already exists
      const existingInstance = parent.findNode(instanceKey);
      if (existingInstance) {
        continue; // Skip if already exists
      }

      // Clone the template and mark as destroyable
      const instanceTitle = TreeNode.generateInstanceTitle(
        templateNode.title,
        instanceNumber
      );
      const newInstance = templateNode.clone(instanceKey, instanceTitle, {
        destroyOnUntoggle: true,
      });

      // Add as sibling after the last instance
      const currentLastInstance =
        templateNode.getDynamicInstances()[
          templateNode.getDynamicInstances().length - 1
        ];
      currentLastInstance.addSibling(newInstance, "after");
    }
  }

  return trees;
}

// ========================================
// Backward Compatibility Helpers
// ========================================

/**
 * Get the depth of a tree (for backward compatibility)
 */
export function getTreeDepth(tree: TreeNode): number {
  return tree.getDepth();
}

/**
 * Get the maximum depth across multiple trees
 */
export function getTreeDepthArray(trees: TreeNode[]): number {
  if (trees.length === 0) return 1;
  return Math.max(...trees.map((tree) => tree.getDepth()));
}

/**
 * Find a node by key in an array of trees
 */
export function findNodeByKeyArray(
  trees: TreeNode[],
  nodeKey: string
): TreeNode | null {
  for (const tree of trees) {
    const node = tree.findNode(nodeKey);
    if (node) return node;
  }
  return null;
}

/**
 * Find the path to a node in an array of trees (without root)
 */
export function findNodePathArray(
  trees: TreeNode[],
  targetKey: string
): string[] {
  for (const tree of trees) {
    const node = tree.findNode(targetKey);
    if (node) {
      return node.getPathWithoutRoot();
    }
  }
  return [targetKey]; // Fallback if not found
}

/**
 * Get nested value from tags object
 */
export function getNestedValue(
  obj: Record<string, unknown>,
  path: string[]
): Record<string, unknown> | undefined {
  let current = obj;

  for (let i = 0; i < path.length; i++) {
    const pathPart = path[i];

    if (!current[pathPart]) {
      return undefined;
    }

    if (i === path.length - 1) {
      return current[pathPart] as Record<string, unknown>;
    } else {
      current = current[pathPart] as Record<string, unknown>;
    }
  }

  return undefined;
}
