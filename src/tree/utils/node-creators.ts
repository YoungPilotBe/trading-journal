import { z } from "zod";
import type { TreeNodeConfig, TreeNodeMetadata } from "../tree.utils.new";
import { TreeNode } from "../TreeNode.class";

// Type for input field schemas
export interface InputFieldSchema {
  schema: z.ZodType<string>;
  placeholder: string;
  custom: Array<{
    key: string;
    transform: (rawValue: unknown) => unknown;
  }>;
}

/**
 * Common node creation helper
 */
export const constructNode = (
  key: string,
  title: string,
  options?: TreeNodeMetadata & { children?: TreeNodeConfig[] }
): TreeNodeConfig => ({
  key,
  title,
  metadata: {
    icon: options?.icon,
    iconClassName: options?.iconClassName || "",
    anti: options?.anti,
    isConfirmation: options?.isConfirmation,
    imageUrl: options?.imageUrl,
    imageClassName: options?.imageClassName,
    inputField: options?.inputField,
    isAddable: options?.isAddable,
    addButtonLabel: options?.addButtonLabel,
    addablePrefix: options?.addablePrefix,
    isDir: options?.isDir,
    maxInstances: options?.maxInstances,
    description: options?.description,
  },
  children: options?.children,
});

/**
 * Helper to create anti-selecting branches (like bullish/bearish pairs)
 */
export const constructAntiBranch = (
  options: Array<{
    key: string;
    title: string;
    children?: TreeNodeConfig[];
    metadata?: TreeNodeMetadata;
  }>
): TreeNodeConfig[] => {
  const keys = options.map((opt) => opt.key);

  return options.map((option, index) =>
    constructNode(option.key, option.title, {
      anti: keys.filter((_, i) => i !== index),
      ...option.metadata,
      children: option.children,
    })
  );
};

/**
 * Helper to recursively convert TreeNode to TreeNodeConfig
 */
export const treeNodeToConfig = (node: TreeNode): TreeNodeConfig => ({
  key: node.key,
  title: node.title,
  metadata: node.metadata,
  children: node.children.map(treeNodeToConfig),
});

/**
 * Helper to create timeframe-based children
 */
export const createTimeframedChildren = (
  prefix: string,
  availableTimeframes: string[],
  childrenFn: () => TreeNodeConfig[]
): TreeNodeConfig[] => {
  if (availableTimeframes.length === 0) {
    return childrenFn();
  }

  // createTimeframeNodes returns TreeNode[], but we need TreeNodeConfig[]
  // So we need to convert them back to config format recursively
  const nodes = createTimeframeNodes({
    prefix,
    availableTimeframes,
    createChildren: () => childrenFn(),
  });

  return nodes.map(treeNodeToConfig);
};

// Import here to avoid circular dependency
import { createTimeframeNodes } from "../tree.utils.new";
