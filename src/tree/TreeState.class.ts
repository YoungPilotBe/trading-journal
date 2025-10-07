/**
 * TreeState Class - Manages tree selection and expansion state
 *
 * This class handles:
 * - Expanded/collapsed nodes tracking
 * - Selected nodes tracking
 * - Tag JSON generation from selections
 * - Toggle operations with anti-selection logic
 * - Input field data management
 */

import { TreeNode } from "./TreeNode.class";

/**
 * State interface for tree
 */
export interface ITreeState {
  expandedKeys: Set<string>;
  selectedNodes: Set<string>;
  tags: Record<string, unknown>;
}

/**
 * TreeState - Manages selection and expansion state for a tree
 */
export class TreeState {
  private expandedKeys: Set<string>;
  private selectedNodes: Set<string>;
  private tags: Record<string, unknown>;
  private trees: TreeNode[];

  constructor(trees: TreeNode[], initialState?: Partial<ITreeState>) {
    this.trees = trees;
    this.expandedKeys = initialState?.expandedKeys || new Set<string>();
    this.selectedNodes = initialState?.selectedNodes || new Set<string>();
    this.tags = initialState?.tags || {};
  }

  // ========================================
  // Getters
  // ========================================

  getExpandedKeys(): Set<string> {
    return new Set(this.expandedKeys);
  }

  getSelectedNodes(): Set<string> {
    return new Set(this.selectedNodes);
  }

  getTags(): Record<string, unknown> {
    return { ...this.tags };
  }

  getState(): ITreeState {
    return {
      expandedKeys: this.getExpandedKeys(),
      selectedNodes: this.getSelectedNodes(),
      tags: this.getTags(),
    };
  }

  // ========================================
  // State Updates
  // ========================================

  /**
   * Update the state from a partial state object
   */
  updateState(newState: Partial<ITreeState>): void {
    if (newState.expandedKeys) {
      this.expandedKeys = new Set(newState.expandedKeys);
    }
    if (newState.selectedNodes) {
      this.selectedNodes = new Set(newState.selectedNodes);
    }
    if (newState.tags !== undefined) {
      this.tags = { ...newState.tags };
    }
  }

  // ========================================
  // Node Operations
  // ========================================

  /**
   * Find a node across all trees
   */
  private findNode(key: string): TreeNode | null {
    for (const tree of this.trees) {
      const node = tree.findNode(key);
      if (node) return node;
    }
    return null;
  }

  /**
   * Toggle a node (branch or leaf) with anti-selection logic
   */
  toggleNode(
    nodeKey: string,
    isBranch: boolean,
    hasAntiSelection: boolean
  ): ITreeState {
    if (hasAntiSelection) {
      return this.toggleWithAntiSelection(nodeKey, isBranch);
    } else if (isBranch) {
      return this.toggleBranchExpansion(nodeKey);
    } else {
      return this.toggleLeaf(nodeKey);
    }
  }

  /**
   * Toggle a branch node with anti-selection logic
   */
  private toggleWithAntiSelection(
    nodeKey: string,
    isBranch: boolean
  ): ITreeState {
    const newSelectedNodes = new Set(this.selectedNodes);
    const newExpandedKeys = new Set(this.expandedKeys);

    const node = this.findNode(nodeKey);
    if (!node) {
      return this.getState();
    }

    const wasSelected = newSelectedNodes.has(nodeKey);

    if (wasSelected) {
      // Check if this is a dynamic instance being untoggled - if so, remove it
      if (this._isDynamicInstance(nodeKey)) {
        return this.removeDynamicNode(nodeKey);
      }

      // Deselect and collapse
      newSelectedNodes.delete(nodeKey);
      newExpandedKeys.delete(nodeKey);

      // Also deselect and collapse all descendants
      if (isBranch) {
        const descendantKeys = node.getAllDescendantKeys();
        descendantKeys.forEach((key) => {
          newSelectedNodes.delete(key);
          newExpandedKeys.delete(key);
        });
      }
    } else {
      // Select and handle anti-logic
      newSelectedNodes.add(nodeKey);

      // Handle anti-selection
      const antiKeys = node.getAntiKeysWithDescendants();
      antiKeys.forEach((antiKey) => {
        newSelectedNodes.delete(antiKey);
        newExpandedKeys.delete(antiKey);
      });

      // Expand if has children and is a branch
      if (node.hasChildren && isBranch) {
        newExpandedKeys.add(nodeKey);
      }
    }

    this.expandedKeys = newExpandedKeys;
    this.selectedNodes = newSelectedNodes;
    this.tags = this.convertSelectionToJson();

    return this.getState();
  }

  /**
   * Toggle branch expansion without anti-selection
   */
  private toggleBranchExpansion(nodeKey: string): ITreeState {
    const newSelectedNodes = new Set(this.selectedNodes);
    const newExpandedKeys = new Set(this.expandedKeys);

    const node = this.findNode(nodeKey);
    if (!node) {
      return this.getState();
    }

    // Toggle expansion
    if (newExpandedKeys.has(nodeKey)) {
      // Check if this is a dynamic instance being collapsed - if so, remove it
      if (this._isDynamicInstance(nodeKey)) {
        return this.removeDynamicNode(nodeKey);
      }

      newExpandedKeys.delete(nodeKey);

      // When collapsing, deselect all descendants
      const descendantKeys = node.getAllDescendantKeys();
      descendantKeys.forEach((key) => {
        newSelectedNodes.delete(key);
        newExpandedKeys.delete(key);
      });
    } else {
      newExpandedKeys.add(nodeKey);
    }

    this.expandedKeys = newExpandedKeys;
    this.selectedNodes = newSelectedNodes;
    this.tags = this.convertSelectionToJson();

    return this.getState();
  }

  /**
   * Toggle a leaf node without anti-selection
   */
  private toggleLeaf(nodeKey: string): ITreeState {
    const newSelectedNodes = new Set(this.selectedNodes);

    if (newSelectedNodes.has(nodeKey)) {
      // Check if this is a dynamic instance being untoggled - if so, remove it
      if (this._isDynamicInstance(nodeKey)) {
        return this.removeDynamicNode(nodeKey);
      }

      newSelectedNodes.delete(nodeKey);
    } else {
      newSelectedNodes.add(nodeKey);
    }

    this.selectedNodes = newSelectedNodes;
    this.tags = this.convertSelectionToJson();

    return this.getState();
  }

  /**
   * Check if a node should be destroyed when untoggled
   * This is determined by the destroyOnUntoggle metadata flag
   */
  private _isDynamicInstance(nodeKey: string): boolean {
    const node = this.findNode(nodeKey);
    if (!node) return false;

    // Check if the node has the destroyOnUntoggle flag set
    return node.metadata.destroyOnUntoggle === true;
  }

  // ========================================
  // Tag Management
  // ========================================

  /**
   * Convert current selection to nested JSON structure
   */
  private convertSelectionToJson(): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const tree of this.trees) {
      const treeResult = this.convertTreeSelectionToJson(tree);
      Object.assign(result, treeResult);
    }

    return result;
  }

  /**
   * Convert selection for a single tree to JSON
   */
  private convertTreeSelectionToJson(tree: TreeNode): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    this.selectedNodes.forEach((nodeKey) => {
      const node = tree.findNode(nodeKey);
      if (!node) return;

      const path = node.getPathWithoutRoot();
      if (path.length === 0) return;

      // Build nested object structure
      let current: Record<string, unknown> = result;

      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];

        // If the current segment is already set to true (boolean),
        // convert it to an object to add children
        if (current[segment] === true) {
          current[segment] = {};
        } else if (!current[segment] || typeof current[segment] !== "object") {
          current[segment] = {};
        }

        current = current[segment] as Record<string, unknown>;
      }

      // Set the final node to true
      const nodeName = path[path.length - 1];
      current[nodeName] = true;
    });

    return result;
  }

  // ========================================
  // Dynamic Node Management
  // ========================================

  /**
   * Add a new dynamic instance of a node
   */
  addDynamicNode(templateNodeKey: string): ITreeState {
    const templateNode = this.findNode(templateNodeKey);
    if (!templateNode || !templateNode.metadata.isAddable) {
      return this.getState();
    }

    const parent = templateNode.parent;
    if (!parent) {
      return this.getState();
    }

    // Check max instances
    if (templateNode.metadata.maxInstances !== undefined) {
      const instances = templateNode.getDynamicInstances();
      if (instances.length >= templateNode.metadata.maxInstances) {
        console.warn(
          `Maximum instances (${templateNode.metadata.maxInstances}) reached for ${templateNodeKey}`
        );
        return this.getState();
      }
    }

    // Get all existing keys in the tree to ensure uniqueness
    const allKeys: string[] = [];
    for (const tree of this.trees) {
      allKeys.push(...tree.getAllDescendantKeys());
      allKeys.push(tree.key);
    }

    // Generate unique key and title
    let instanceKey: string;
    let instanceNumber: number;

    // Use custom addablePrefix function if provided
    if (templateNode.metadata.addablePrefix) {
      instanceKey = TreeNode.generateInstanceKey(templateNodeKey, allKeys);
      instanceNumber = parseInt(instanceKey.split("#")[1]);
      instanceKey = templateNode.metadata.addablePrefix(
        templateNodeKey,
        instanceNumber
      );
    } else {
      // Default behavior
      instanceKey = TreeNode.generateInstanceKey(templateNodeKey, allKeys);
      instanceNumber = parseInt(instanceKey.split("#")[1]);
    }

    const instanceTitle = TreeNode.generateInstanceTitle(
      templateNode.title,
      instanceNumber
    );

    // Clone the template node with new key and title
    // Mark this instance as destroyable when untoggled
    const newInstance = templateNode.clone(instanceKey, instanceTitle, {
      destroyOnUntoggle: true,
    });

    // Add as a sibling after the template node (or after the last instance)
    const instances = templateNode.getDynamicInstances();
    const lastInstance = instances[instances.length - 1];
    lastInstance.addSibling(newInstance, "after");

    // Automatically select the new instance
    this.selectedNodes.add(instanceKey);

    // Expand the new instance if it has children
    if (newInstance.hasChildren) {
      this.expandedKeys.add(instanceKey);
    }

    this.tags = this.convertSelectionToJson();
    return this.getState();
  }

  /**
   * Remove a dynamic instance node
   */
  removeDynamicNode(instanceKey: string): ITreeState {
    const instanceNode = this.findNode(instanceKey);
    if (!instanceNode) {
      return this.getState();
    }

    // Only allow removing nodes that are instances (have #N in their key)
    if (!instanceKey.includes("_#")) {
      console.warn(`Cannot remove non-instance node: ${instanceKey}`);
      return this.getState();
    }

    const parent = instanceNode.parent;
    if (!parent) {
      return this.getState();
    }

    // Remove from expanded and selected
    this.expandedKeys.delete(instanceKey);
    this.selectedNodes.delete(instanceKey);

    // Remove all descendants from state
    const descendantKeys = instanceNode.getAllDescendantKeys();
    descendantKeys.forEach((key) => {
      this.expandedKeys.delete(key);
      this.selectedNodes.delete(key);
    });

    // Remove the node from the tree
    parent.removeChild(instanceKey);

    this.tags = this.convertSelectionToJson();
    return this.getState();
  }

  // ========================================
  // Input Field Management
  // ========================================

  /**
   * Save input field data for a node
   */
  saveInputField(nodeKey: string, values: Record<string, unknown>): ITreeState {
    const node = this.findNode(nodeKey);
    if (!node) return this.getState();

    const path = node.getPathWithoutRoot();
    const newTags = { ...this.tags };

    this.setNestedValue(newTags, path, values, true);

    this.tags = newTags;
    return this.getState();
  }

  /**
   * Set a nested value in an object
   */
  private setNestedValue(
    obj: Record<string, unknown>,
    path: string[],
    value: Record<string, unknown>,
    merge: boolean = true
  ): void {
    let current = obj;

    for (let i = 0; i < path.length; i++) {
      const pathPart = path[i];

      if (!current[pathPart]) {
        current[pathPart] = {};
      }

      // If this is the last part, we're at the target node
      if (i === path.length - 1) {
        if (merge) {
          current[pathPart] = {
            ...((current[pathPart] as Record<string, unknown>) || {}),
            ...value,
          };
        } else {
          current[pathPart] = value;
        }
      } else {
        current = current[pathPart] as Record<string, unknown>;
      }
    }
  }

  /**
   * Get nested value from tags
   */
  getNestedValue(path: string[]): Record<string, unknown> | undefined {
    let current: Record<string, unknown> = this.tags;

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
}
