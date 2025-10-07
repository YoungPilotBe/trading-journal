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
  readonly path: string;
  readonly title: string;
  readonly metadata: TreeNodeMetadata;

  private _children: TreeNode[] = [];
  private _parent: TreeNode | null = null;

  constructor(config: TreeNodeConfig, parentPath?: string) {
    this.key = config.key;
    this.title = config.title;
    this.metadata = config.metadata || {};

    // Auto-generate path from parent path + key
    // If parentPath provided, use it; otherwise this is a root node
    this.path = parentPath ? `${parentPath}.${config.key}` : config.key;

    if (config.children) {
      config.children.forEach((childConfig) => {
        const child =
          childConfig instanceof TreeNode
            ? childConfig
            : new TreeNode(childConfig, this.path);
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
   * @deprecated Use findNodeByPath instead for unique identification
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
   * Find a node by path in this subtree
   */
  findNodeByPath(path: string): TreeNode | null {
    if (this.path === path) return this;

    for (const child of this._children) {
      const found = child.findNodeByPath(path);
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
   * Remove a child node by path (more precise than by key)
   */
  removeChildByPath(path: string): boolean {
    const index = this._children.findIndex((c) => c.path === path);
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
   * Clone this node with a new key and optional instance suffix for dynamic nodes
   * For dynamic instances, the path will include the instance in bracket notation: range.[#1]
   */
  clone(
    newKey: string,
    newTitle?: string,
    metadataOverrides?: Partial<TreeNodeMetadata>,
    instanceNumber?: number
  ): TreeNode {
    // If this is a dynamic instance, ensure it's not addable itself
    const updatedMetadata = {
      ...this.metadata,
      ...metadataOverrides,
      // Dynamic instances should never be addable themselves - only the template is addable
      ...(instanceNumber !== undefined ? { isAddable: false } : {}),
    };

    // Anti-selection keys remain as simple sibling keys (no path transformation needed)
    // They will be resolved to full paths at runtime by looking at siblings

    // Determine the parent path for this cloned node
    const parentPath = this._parent?.path;

    // For dynamic instances, construct path with bracket notation
    let clonedNodePath: string;
    if (instanceNumber !== undefined) {
      // Dynamic instance: parent.path + "." + key + ".[#N]"
      clonedNodePath = parentPath
        ? `${parentPath}.${newKey}.[#${instanceNumber}]`
        : `${newKey}.[#${instanceNumber}]`;
    } else {
      // Normal clone: parent.path + "." + key
      clonedNodePath = parentPath ? `${parentPath}.${newKey}` : newKey;
    }

    // Clone children - they inherit from the cloned node's path
    // NOTE: Do NOT propagate destroyOnUntoggle to children - only the root instance should be destroyable
    const clonedChildren = this._children.map((child) => {
      const childMetadataOverrides = metadataOverrides
        ? { ...metadataOverrides, destroyOnUntoggle: undefined }
        : undefined;

      // Create child with same key (not modified)
      const childNode = new TreeNode(
        {
          key: child.key,
          title: child.title,
          metadata: { ...child.metadata, ...childMetadataOverrides },
          children: child._children.map((c) => c.toJSON()),
        },
        clonedNodePath
      );

      return childNode;
    });

    // Create node without auto-path generation (we set it manually)
    const clonedNode = Object.create(TreeNode.prototype);
    clonedNode.key = newKey;
    clonedNode.path = clonedNodePath;
    clonedNode.title = newTitle || this.title;
    clonedNode.metadata = updatedMetadata;
    clonedNode._children = clonedChildren;
    clonedNode._parent = null;

    // Update children's parent reference
    clonedChildren.forEach((child) => {
      child._parent = clonedNode;
    });

    return clonedNode;
  }

  /**
   * Get all dynamic instances of this node
   * Identifies instances by checking for bracket notation in path: .[#N]
   */
  getDynamicInstances(): TreeNode[] {
    if (!this._parent) return [];

    const baseKey = this.key;

    // Find all siblings with same key (template + all instances)
    return this._parent._children.filter((sibling) => {
      return sibling.key === baseKey;
    });
  }

  /**
   * Generate next instance number for dynamic nodes
   * Checks existing paths with bracket notation
   */
  static generateInstanceNumber(
    baseKey: string,
    existingPaths: string[]
  ): number {
    let instanceNumber = 1;

    // Check all paths for existing instances of this key with bracket notation
    const instancePattern = new RegExp(`\\.${baseKey}\\.\\[#(\\d+)\\]`);

    const existingNumbers = existingPaths
      .map((path) => {
        const match = path.match(instancePattern);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null);

    if (existingNumbers.length > 0) {
      instanceNumber = Math.max(...existingNumbers) + 1;
    }

    return instanceNumber;
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
   * Resolve anti-selection sibling keys to full paths
   * Anti keys in metadata are simple sibling keys, resolved at runtime
   */
  resolveAntiPaths(): string[] {
    if (!this.antiKeys || this.antiKeys.length === 0) {
      return [];
    }

    if (!this._parent) {
      return [];
    }

    const antiPaths: string[] = [];

    // Look through siblings to find nodes with matching keys
    for (const antiKey of this.antiKeys) {
      const sibling = this._parent._children.find(
        (child) => child.key === antiKey
      );
      if (sibling) {
        antiPaths.push(sibling.path);
      }
    }

    return antiPaths;
  }

  /**
   * Get all paths that should be deselected when this node is selected
   * Includes anti paths and their descendants
   */
  getAntiPathsWithDescendants(): string[] {
    const antiPaths = this.resolveAntiPaths();
    const allAntiPaths = [...antiPaths];
    const root = this.getRoot();

    // For each anti path, also get its descendants
    antiPaths.forEach((antiPath) => {
      const antiNode = root.findNodeByPath(antiPath);
      if (antiNode?.hasChildren) {
        antiNode.getAllDescendants().forEach((desc) => {
          allAntiPaths.push(desc.path);
        });
      }
    });

    return allAntiPaths;
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
