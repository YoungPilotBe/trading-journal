/**
 * TreeNode Class - Core tree structure with encapsulated logic
 *
 * This class represents a single node in the tree structure with:
 * - Parent/child relationships
 * - Metadata for rendering (icons, images, descriptions)
 * - Anti-selection logic
 * - Tree navigation and manipulation methods
 */

import type { LucideIcon } from "lucide-react";
import { z } from "zod";

// Custom value transformation function type
export type CustomValueTransform = (rawValue: unknown) => unknown;

// Input field configuration type
export type InputFieldConfig = {
  schema: z.ZodSchema<unknown>;
  placeholder?: string;
  custom?: Array<{
    key: string;
    transform: CustomValueTransform;
  }>;
};

/**
 * Metadata for TreeNode - all visual and configuration properties
 * separated from core tree structure
 */
export interface TreeNodeMetadata {
  anti?: string[];
  icon?: LucideIcon;
  iconClassName?: string;
  isDir?: boolean;
  isConfirmation?: boolean;
  isTimeframe?: boolean;
  description?: string;
  imageUrl?: string;
  imageClassName?: string;
  inputField?: InputFieldConfig;

  // Dynamic node creation properties
  isAddable?: boolean; // If true, users can add multiple instances of this node
  addButtonLabel?: string; // Label for the add button (defaults to "+ Add {title}")
  maxInstances?: number; // Maximum number of instances allowed (undefined = unlimited)
  addablePrefix?: (originalKey: string, instanceNumber: number) => string; // Function to generate the prefix for cloned instances
  destroyOnUntoggle?: boolean; // If true, this node will be removed from the tree when untoggled
}

/**
 * Configuration object for creating a TreeNode
 */
export interface TreeNodeConfig {
  key: string;
  title: string;
  children?: TreeNodeConfig[] | TreeNode[];
  metadata?: TreeNodeMetadata;
}

/**
 * TreeNode Class
 *
 * Represents a node in the tree with full encapsulation of tree operations.
 * Maintains parent/child relationships and provides methods for:
 * - Navigation (finding nodes, getting paths)
 * - Manipulation (adding/removing children and siblings)
 * - Queries (depth, descendants, leaf status)
 * - Anti-selection logic
 */
export class TreeNode {
  readonly key: string;
  readonly title: string;
  readonly metadata: TreeNodeMetadata;

  private _children: TreeNode[] = [];
  private _parent: TreeNode | null = null;

  constructor(config: TreeNodeConfig) {
    this.key = config.key;
    this.title = config.title;
    this.metadata = config.metadata || {};

    if (config.children) {
      config.children.forEach((childConfig) => {
        const child =
          childConfig instanceof TreeNode
            ? childConfig
            : new TreeNode(childConfig);
        this.addChild(child);
      });
    }
  }

  // ========================================
  // Getters
  // ========================================

  get children(): ReadonlyArray<TreeNode> {
    return this._children;
  }

  get parent(): TreeNode | null {
    return this._parent;
  }

  get isLeaf(): boolean {
    return this._children.length === 0;
  }

  get hasChildren(): boolean {
    return this._children.length > 0;
  }

  get antiKeys(): string[] {
    return this.metadata.anti || [];
  }

  // ========================================
  // Tree Navigation Methods
  // ========================================

  /**
   * Get the depth of this subtree (1 for leaf, max child depth + 1 otherwise)
   */
  getDepth(): number {
    if (this.isLeaf) return 1;
    return Math.max(...this._children.map((c) => c.getDepth())) + 1;
  }

  /**
   * Get the path from root to this node as an array of keys
   */
  getPath(): string[] {
    const path: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: TreeNode | null = this;
    while (current) {
      path.unshift(current.key);
      current = current.parent;
    }
    return path;
  }

  /**
   * Get the path without the root node
   */
  getPathWithoutRoot(): string[] {
    const path = this.getPath();
    return path.length > 1 ? path.slice(1) : path;
  }

  /**
   * Get the root node of this tree
   */
  getRoot(): TreeNode {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: TreeNode = this;
    while (current.parent) {
      current = current.parent;
    }
    return current;
  }

  /**
   * Find a node by key in this subtree
   */
  findNode(key: string): TreeNode | null {
    if (this.key === key) return this;

    for (const child of this._children) {
      const found = child.findNode(key);
      if (found) return found;
    }

    return null;
  }

  /**
   * Get all descendant keys (children, grandchildren, etc.)
   */
  getAllDescendantKeys(): string[] {
    const keys: string[] = [];
    for (const child of this._children) {
      keys.push(child.key);
      keys.push(...child.getAllDescendantKeys());
    }
    return keys;
  }

  /**
   * Get all descendant nodes
   */
  getAllDescendants(): TreeNode[] {
    const nodes: TreeNode[] = [];
    for (const child of this._children) {
      nodes.push(child);
      nodes.push(...child.getAllDescendants());
    }
    return nodes;
  }

  // ========================================
  // Tree Manipulation Methods
  // ========================================

  /**
   * Add a child node
   */
  addChild(node: TreeNode, index?: number): void {
    // Remove from old parent if it has one
    if (node._parent) {
      node._parent.removeChild(node.key);
    }

    node._parent = this;

    if (index !== undefined && index >= 0 && index <= this._children.length) {
      this._children.splice(index, 0, node);
    } else {
      this._children.push(node);
    }
  }

  /**
   * Remove a child node by key
   */
  removeChild(key: string): boolean {
    const index = this._children.findIndex((c) => c.key === key);
    if (index !== -1) {
      this._children[index]._parent = null;
      this._children.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Add a sibling node (before or after this node)
   */
  addSibling(node: TreeNode, position: "before" | "after" = "after"): boolean {
    if (!this._parent) return false;

    const siblings = this._parent._children;
    const myIndex = siblings.indexOf(this);
    if (myIndex === -1) return false;

    const insertIndex = position === "after" ? myIndex + 1 : myIndex;
    this._parent.addChild(node, insertIndex);
    return true;
  }

  /**
   * Remove a sibling node by key
   */
  removeSibling(key: string): boolean {
    if (!this._parent) return false;
    return this._parent.removeChild(key);
  }

  // ========================================
  // Dynamic Node Creation
  // ========================================

  /**
   * Extract the prefix from a key by finding the common suffix
   * Example: demand_range_1m -> prefix: demand_range, suffix: 1m
   */
  private _extractKeyPrefixes(
    oldKey: string,
    newKey: string
  ): { oldPrefix: string; newPrefix: string } {
    const oldKeyParts = oldKey.split("_");
    const newKeyParts = newKey.split("_");

    // Find the last common suffix (e.g., "1m" in both keys)
    let suffixStartIndex = -1;
    for (
      let i = 1;
      i <= Math.min(oldKeyParts.length, newKeyParts.length);
      i++
    ) {
      const oldIndex = oldKeyParts.length - i;
      const newIndex = newKeyParts.length - i;
      if (oldKeyParts[oldIndex] === newKeyParts[newIndex]) {
        suffixStartIndex = oldIndex;
      } else {
        break;
      }
    }

    // Extract prefixes (everything before the common suffix)
    const oldPrefix =
      suffixStartIndex > 0
        ? oldKeyParts.slice(0, suffixStartIndex).join("_")
        : oldKey;

    const newPrefix =
      suffixStartIndex > 0 && suffixStartIndex < newKeyParts.length
        ? newKeyParts
            .slice(
              0,
              newKeyParts.length - (oldKeyParts.length - suffixStartIndex)
            )
            .join("_")
        : newKey;

    return { oldPrefix, newPrefix };
  }

  /**
   * Update anti-selection keys by replacing the old prefix with the new prefix
   */
  private _updateAntiKeys(
    antiKeys: string[],
    oldPrefix: string,
    newPrefix: string
  ): string[] {
    return antiKeys.map((antiKey) => {
      if (antiKey.startsWith(oldPrefix + "_") || antiKey === oldPrefix) {
        return antiKey.replace(oldPrefix, newPrefix);
      }
      return antiKey;
    });
  }

  /**
   * Clone this node with a new key and title
   * Useful for creating dynamic instances
   */
  clone(
    newKey: string,
    newTitle?: string,
    metadataOverrides?: Partial<TreeNodeMetadata>
  ): TreeNode {
    const updatedMetadata = { ...this.metadata, ...metadataOverrides };

    // Update anti-selection keys to match the new cloned structure
    if (updatedMetadata.anti && updatedMetadata.anti.length > 0) {
      const { oldPrefix, newPrefix } = this._extractKeyPrefixes(
        this.key,
        newKey
      );
      updatedMetadata.anti = this._updateAntiKeys(
        updatedMetadata.anti,
        oldPrefix,
        newPrefix
      );
    }

    // Clone children with updated keys
    // NOTE: Do NOT propagate destroyOnUntoggle to children - only the root instance should be destroyable
    const clonedChildren = this._children.map((child) => {
      const childKeySuffix = child.key.replace(this.key + "_", "");
      const childMetadataOverrides = metadataOverrides
        ? { ...metadataOverrides, destroyOnUntoggle: undefined }
        : undefined;
      return child.clone(
        `${newKey}_${childKeySuffix}`,
        undefined,
        childMetadataOverrides
      );
    });

    // Create and return the cloned node
    return new TreeNode({
      key: newKey,
      title: newTitle || this.title,
      metadata: updatedMetadata,
      children: clonedChildren,
    });
  }

  /**
   * Get all dynamic instances of this node (nodes that share the same template key pattern)
   */
  getDynamicInstances(): TreeNode[] {
    if (!this._parent) return [];

    // Extract the base key (without instance number)
    const baseKeyMatch = this.key.match(/^(.+)_#\d+$/);
    const baseKey = baseKeyMatch ? baseKeyMatch[1] : this.key;

    // Find all siblings that match the pattern
    return this._parent._children.filter((sibling) => {
      return sibling.key === baseKey || sibling.key.startsWith(`${baseKey}_#`);
    });
  }

  /**
   * Generate a unique key for a new instance
   */
  static generateInstanceKey(baseKey: string, existingKeys: string[]): string {
    let instanceNumber = 1;
    let newKey = `${baseKey}_#${instanceNumber}`;

    while (existingKeys.includes(newKey)) {
      instanceNumber++;
      newKey = `${baseKey}_#${instanceNumber}`;
    }

    return newKey;
  }

  /**
   * Generate a title for a new instance
   */
  static generateInstanceTitle(
    baseTitle: string,
    instanceNumber: number
  ): string {
    return `${baseTitle} #${instanceNumber}`;
  }

  // ========================================
  // Anti-Selection Logic
  // ========================================

  /**
   * Get all keys that should be deselected when this node is selected
   * Includes anti keys and their descendants
   */
  getAntiKeysWithDescendants(): string[] {
    const antiKeys = [...this.antiKeys];
    const root = this.getRoot();

    // For each anti key, also get its descendants
    this.antiKeys.forEach((antiKey) => {
      const antiNode = root.findNode(antiKey);
      if (antiNode?.hasChildren) {
        antiKeys.push(...antiNode.getAllDescendantKeys());
      }
    });

    return antiKeys;
  }

  // ========================================
  // Serialization
  // ========================================

  /**
   * Convert this tree to a plain object structure
   */
  toJSON(): TreeNodeConfig {
    return {
      key: this.key,
      title: this.title,
      metadata: { ...this.metadata },
      children: this._children.map((child) => child.toJSON()),
    };
  }

  /**
   * Create a TreeNode from a plain object
   */
  static fromJSON(config: TreeNodeConfig): TreeNode {
    return new TreeNode(config);
  }

  // ========================================
  // Utility Methods
  // ========================================

  /**
   * Check if this node is an ancestor of another node
   */
  isAncestorOf(node: TreeNode): boolean {
    let current = node.parent;
    while (current) {
      if (current === this) return true;
      current = current.parent;
    }
    return false;
  }

  /**
   * Check if this node is a descendant of another node
   */
  isDescendantOf(node: TreeNode): boolean {
    return node.isAncestorOf(this);
  }

  /**
   * Get the level/depth of this node in the tree (0-indexed from root)
   */
  getLevel(): number {
    let level = 0;
    let current = this.parent;
    while (current) {
      level++;
      current = current.parent;
    }
    return level;
  }
}
