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
  expandedPaths: Set<string>;
  selectedPaths: Set<string>;
  tags: Record<string, unknown>;
}

/**
 * TreeState - Manages selection and expansion state for a tree
 */
export class TreeState {
  private expandedPaths: Set<string>;
  private selectedPaths: Set<string>;
  private tags: Record<string, unknown>;
  private trees: TreeNode[];

  constructor(trees: TreeNode[], initialState?: Partial<ITreeState>) {
    this.trees = trees;
    this.expandedPaths = initialState?.expandedPaths || new Set<string>();
    this.selectedPaths = initialState?.selectedPaths || new Set<string>();
    this.tags = initialState?.tags || {};
  }

  // ========================================
  // Getters
  // ========================================

  getExpandedPaths(): Set<string> {
    return new Set(this.expandedPaths);
  }

  getSelectedPaths(): Set<string> {
    return new Set(this.selectedPaths);
  }

  getTags(): Record<string, unknown> {
    return { ...this.tags };
  }

  getState(): ITreeState {
    return {
      expandedPaths: this.getExpandedPaths(),
      selectedPaths: this.getSelectedPaths(),
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
    if (newState.expandedPaths) {
      this.expandedPaths = new Set(newState.expandedPaths);
    }
    if (newState.selectedPaths) {
      this.selectedPaths = new Set(newState.selectedPaths);
    }
    if (newState.tags !== undefined) {
      this.tags = { ...newState.tags };
    }
  }

  // ========================================
  // Node Operations
  // ========================================

  /**
   * Find a node by path across all trees
   */
  private findNodeByPath(path: string): TreeNode | null {
    for (const tree of this.trees) {
      const node = tree.findNodeByPath(path);
      if (node) return node;
    }
    return null;
  }

  /**
   * Toggle a node (branch or leaf) with anti-selection logic
   */
  toggleNode(
    nodePath: string,
    isBranch: boolean,
    hasAntiSelection: boolean
  ): ITreeState {
    if (hasAntiSelection) {
      return this.toggleWithAntiSelection(nodePath, isBranch);
    } else if (isBranch) {
      return this.toggleBranchExpansion(nodePath);
    } else {
      return this.toggleLeaf(nodePath);
    }
  }

  /**
   * Toggle a branch node with anti-selection logic
   */
  private toggleWithAntiSelection(
    nodePath: string,
    isBranch: boolean
  ): ITreeState {
    const newSelectedPaths = new Set(this.selectedPaths);
    const newExpandedPaths = new Set(this.expandedPaths);

    const node = this.findNodeByPath(nodePath);
    if (!node) {
      return this.getState();
    }

    const wasSelected = newSelectedPaths.has(nodePath);

    if (wasSelected) {
      // Check if this is a dynamic instance being untoggled - if so, remove it
      if (this._isDynamicInstance(nodePath)) {
        return this.removeDynamicNode(nodePath);
      }

      // Deselect and collapse
      newSelectedPaths.delete(nodePath);
      newExpandedPaths.delete(nodePath);

      // Also deselect and collapse all descendants
      if (isBranch) {
        node.getAllDescendants().forEach((descendant) => {
          newSelectedPaths.delete(descendant.path);
          newExpandedPaths.delete(descendant.path);
        });
      }
    } else {
      // Select and handle anti-logic
      newSelectedPaths.add(nodePath);

      // Handle anti-selection - resolve sibling keys to paths
      const antiPaths = node.getAntiPathsWithDescendants();
      antiPaths.forEach((antiPath) => {
        newSelectedPaths.delete(antiPath);
        newExpandedPaths.delete(antiPath);
      });

      // Expand if has children and is a branch
      if (node.hasChildren && isBranch) {
        newExpandedPaths.add(nodePath);
      }
    }

    this.expandedPaths = newExpandedPaths;
    this.selectedPaths = newSelectedPaths;
    this.tags = this.convertSelectionToJson();

    return this.getState();
  }

  /**
   * Toggle branch expansion without anti-selection
   */
  private toggleBranchExpansion(nodePath: string): ITreeState {
    const newSelectedPaths = new Set(this.selectedPaths);
    const newExpandedPaths = new Set(this.expandedPaths);

    const node = this.findNodeByPath(nodePath);
    if (!node) {
      return this.getState();
    }

    // Toggle expansion
    if (newExpandedPaths.has(nodePath)) {
      // Check if this is a dynamic instance being collapsed - if so, remove it
      if (this._isDynamicInstance(nodePath)) {
        return this.removeDynamicNode(nodePath);
      }

      newExpandedPaths.delete(nodePath);

      // When collapsing, deselect all descendants
      node.getAllDescendants().forEach((descendant) => {
        newSelectedPaths.delete(descendant.path);
        newExpandedPaths.delete(descendant.path);
      });
    } else {
      newExpandedPaths.add(nodePath);
    }

    this.expandedPaths = newExpandedPaths;
    this.selectedPaths = newSelectedPaths;
    this.tags = this.convertSelectionToJson();

    return this.getState();
  }

  /**
   * Toggle a leaf node without anti-selection
   */
  private toggleLeaf(nodePath: string): ITreeState {
    const newSelectedPaths = new Set(this.selectedPaths);

    if (newSelectedPaths.has(nodePath)) {
      // Check if this is a dynamic instance being untoggled - if so, remove it
      if (this._isDynamicInstance(nodePath)) {
        return this.removeDynamicNode(nodePath);
      }

      newSelectedPaths.delete(nodePath);
    } else {
      newSelectedPaths.add(nodePath);
    }

    this.selectedPaths = newSelectedPaths;
    this.tags = this.convertSelectionToJson();

    return this.getState();
  }

  /**
   * Check if a node should be destroyed when untoggled
   * This is determined by the destroyOnUntoggle metadata flag
   */
  private _isDynamicInstance(nodePath: string): boolean {
    const node = this.findNodeByPath(nodePath);
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
   * Paths are dot-separated like "demand.range.obim.1m"
   * Dynamic instances use bracket notation: "demand.range.[#1].obim"
   */
  private convertTreeSelectionToJson(tree: TreeNode): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    this.selectedPaths.forEach((nodePath) => {
      const node = tree.findNodeByPath(nodePath);
      if (!node) return;

      // Split path by dots, but keep bracket notation together
      // e.g., "demand.range.[#1].obim" -> ["demand", "range", "[#1]", "obim"]
      const pathSegments = nodePath.split(".");

      // Skip the root segment (first segment is the tree root)
      const segments = pathSegments.slice(1);
      if (segments.length === 0) return;

      // Build nested object structure
      let current: Record<string, unknown> = result;

      for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];

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
      const nodeName = segments[segments.length - 1];
      current[nodeName] = true;
    });

    return result;
  }

  // ========================================
  // Dynamic Node Management
  // ========================================

  /**
   * Add a new dynamic instance of a node
   * Template is identified by path, instance will have bracket notation in path
   */
  addDynamicNode(templateNodePath: string): ITreeState {
    const templateNode = this.findNodeByPath(templateNodePath);
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
          `Maximum instances (${templateNode.metadata.maxInstances}) reached for ${templateNodePath}`
        );
        return this.getState();
      }
    }

    // Get all existing paths in the tree to determine next instance number
    const allPaths: string[] = [];
    for (const tree of this.trees) {
      tree.getAllDescendants().forEach((node) => allPaths.push(node.path));
      allPaths.push(tree.path);
    }

    // Generate unique instance number
    const instanceNumber = TreeNode.generateInstanceNumber(
      templateNode.key,
      allPaths
    );
    const instanceTitle = TreeNode.generateInstanceTitle(
      templateNode.title,
      instanceNumber
    );

    // Clone the template node with instance number
    // This will create a path with bracket notation like "demand.range.[#1]"
    const newInstance = templateNode.clone(
      templateNode.key, // Keep the same key
      instanceTitle,
      { destroyOnUntoggle: true },
      instanceNumber // Pass instance number for path generation
    );

    // Add as a sibling after the last instance
    const instances = templateNode.getDynamicInstances();
    const lastInstance = instances[instances.length - 1];
    lastInstance.addSibling(newInstance, "after");

    // Automatically select the new instance
    this.selectedPaths.add(newInstance.path);

    // Expand the new instance if it has children
    if (newInstance.hasChildren) {
      this.expandedPaths.add(newInstance.path);
    }

    this.tags = this.convertSelectionToJson();
    return this.getState();
  }

  /**
   * Remove a dynamic instance node
   * Instance is identified by bracket notation in path: .[#N]
   */
  removeDynamicNode(instancePath: string): ITreeState {
    const instanceNode = this.findNodeByPath(instancePath);
    if (!instanceNode) {
      return this.getState();
    }

    // Only allow removing nodes that are instances (have .[#N] in their path)
    if (!instancePath.match(/\.\[#\d+\]/)) {
      console.warn(`Cannot remove non-instance node: ${instancePath}`);
      return this.getState();
    }

    const parent = instanceNode.parent;
    if (!parent) {
      return this.getState();
    }

    // Remove from expanded and selected
    this.expandedPaths.delete(instancePath);
    this.selectedPaths.delete(instancePath);

    // Remove all descendants from state
    instanceNode.getAllDescendants().forEach((descendant) => {
      this.expandedPaths.delete(descendant.path);
      this.selectedPaths.delete(descendant.path);
    });

    // Remove the node from the tree by key (all instances share same key)
    parent.removeChild(instanceNode.key);

    this.tags = this.convertSelectionToJson();
    return this.getState();
  }

  // ========================================
  // Input Field Management
  // ========================================

  /**
   * Save input field data for a node
   * Path is used to navigate the tags structure
   */
  saveInputField(
    nodePath: string,
    values: Record<string, unknown>
  ): ITreeState {
    const node = this.findNodeByPath(nodePath);
    if (!node) return this.getState();

    // Convert path to segments (excluding root)
    const pathSegments = nodePath.split(".").slice(1);
    const newTags = { ...this.tags };

    this.setNestedValue(newTags, pathSegments, values, true);

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

  /**
   * Get selected timeframes for a specific node type (e.g., "swing", "fractal")
   * Returns an array of timeframe labels that have selected descendants
   */
  getSelectedTimeframesForNodeType(nodeType: string): string[] {
    const selectedTimeframes = new Set<string>();

    this.trees.forEach((tree) => {
      const allNodes = tree.getAllDescendants();
      const targetNodes = allNodes.filter((n) => n.key.includes(nodeType));

      targetNodes.forEach((targetNode) => {
        targetNode.children.forEach((timeframeChild) => {
          // Check if this timeframe has any selected descendants
          const hasSelectedDescendants = timeframeChild.children.some(
            (descendant) => this.selectedPaths.has(descendant.path)
          );

          if (hasSelectedDescendants) {
            selectedTimeframes.add(timeframeChild.title);
          }
        });
      });
    });

    return Array.from(selectedTimeframes);
  }
}
