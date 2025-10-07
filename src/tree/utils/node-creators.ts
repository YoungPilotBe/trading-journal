import { LucideIcon } from "lucide-react";
import { z } from "zod";
import type { TreeNodeConfig } from "../tree.utils.new";

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
  options?: {
    icon?: LucideIcon;
    iconClassName?: string;
    anti?: string[];
    isConfirmation?: boolean;
    imageUrl?: string;
    inputField?: InputFieldSchema;
    children?: TreeNodeConfig[];
    isAddable?: boolean;
    addButtonLabel?: string;
    addablePrefix?: (key: string, num: number) => string;
    isDir?: boolean;
    maxInstances?: number;
  }
): TreeNodeConfig => ({
  key,
  title,
  metadata: {
    icon: options?.icon,
    iconClassName: options?.iconClassName || "",
    anti: options?.anti,
    isConfirmation: options?.isConfirmation,
    imageUrl: options?.imageUrl,
    inputField: options?.inputField,
    isAddable: options?.isAddable,
    addButtonLabel: options?.addButtonLabel,
    addablePrefix: options?.addablePrefix,
    isDir: options?.isDir,
    maxInstances: options?.maxInstances,
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
    icon?: LucideIcon;
    iconClassName?: string;
    children?: TreeNodeConfig[];
    inputField?: InputFieldSchema;
  }>
): TreeNodeConfig[] => {
  const keys = options.map((opt) => opt.key);

  return options.map((option, index) =>
    constructNode(option.key, option.title, {
      icon: option.icon,
      iconClassName: option.iconClassName,
      anti: keys.filter((_, i) => i !== index),
      inputField: option.inputField,
      children: option.children,
    })
  );
};

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
  // So we need to convert them back to config format
  const nodes = createTimeframeNodes({
    prefix,
    availableTimeframes,
    createChildren: () => childrenFn(),
  });

  return nodes.map((node) => ({
    key: node.key,
    title: node.title,
    metadata: node.metadata,
    children: node.children.map((child) => ({
      key: child.key,
      title: child.title,
      metadata: child.metadata,
      children: child.children.map((grandchild) => ({
        key: grandchild.key,
        title: grandchild.title,
        metadata: grandchild.metadata,
      })),
    })),
  }));
};

// Import here to avoid circular dependency
import { createTimeframeNodes } from "../tree.utils.new";
