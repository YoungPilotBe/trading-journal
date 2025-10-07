/**
 * TreeGrid Class - Handles grid positioning and rendering layout
 *
 * This class is responsible for:
 * - Computing grid positions (row, col) for each node
 * - Managing expanded/collapsed state visualization
 * - Flattening tree structure into a 2D grid for rendering
 */

import type { LucideIcon } from "lucide-react";
import type { InputFieldConfig } from "./TreeNode.class";
import { TreeNode } from "./TreeNode.class";

/**
 * Represents a cell in the grid
 */
export interface GridCell {
  content: string;
  level: number;
  rowIndex: number;
  nodeKey: string;
  hasChildren: boolean;
  isExpanded: boolean;
  isLeaf: boolean;
  isSelected: boolean;
  icon?: LucideIcon;
  iconClassName?: string;
  isDir?: boolean;
  isConfirmation?: boolean;
  inputField?: InputFieldConfig;
  parentKey?: string;
  description?: string;
  imageUrl?: string;
  imageClassName?: string;
  // Dynamic node creation
  isAddButton?: boolean;
  addButtonLabel?: string;
  templateNodeKey?: string;
}

/**
 * TreeGrid - Converts tree structure into a 2D grid for rendering
 */
export class TreeGrid {
  private trees: TreeNode[];
  private maxDepth: number;

  constructor(trees: TreeNode[]) {
    this.trees = trees;
    this.maxDepth = this.calculateMaxDepth();
  }

  /**
   * Calculate the maximum depth across all trees
   */
  private calculateMaxDepth(): number {
    if (this.trees.length === 0) return 1;

    // +1 to account for potential input fields
    return Math.max(...this.trees.map((tree) => tree.getDepth())) + 1;
  }

  /**
   * Get the maximum depth (columns needed for the grid)
   */
  getMaxDepth(): number {
    return this.maxDepth;
  }

  /**
   * Flatten the tree(s) into a 2D grid structure
   */
  toGrid(expandedKeys: Set<string>, selectedNodes: Set<string>): GridCell[][] {
    const allRows: GridCell[][] = [];
    let currentRowIndex = 0;

    for (const tree of this.trees) {
      const treeRows = this.flattenTreeToGrid(
        tree,
        expandedKeys,
        selectedNodes
      );

      // Adjust row indices for the combined grid
      treeRows.forEach((row) => {
        const adjustedRow = new Array(this.maxDepth).fill(null);
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

  /**
   * Flatten a single tree into a grid structure
   */
  private flattenTreeToGrid(
    tree: TreeNode,
    expandedKeys: Set<string>,
    selectedNodes: Set<string>
  ): GridCell[][] {
    const rows: GridCell[][] = [];

    const processNode = (
      node: TreeNode,
      level: number,
      rowIndex: number,
      parentKey?: string
    ): number => {
      if (!rows[rowIndex]) {
        rows[rowIndex] = new Array(this.maxDepth).fill(null);
      }

      const hasChildren = node.hasChildren;
      const isExpanded = expandedKeys.has(node.key);
      const isLeaf = node.isLeaf;
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
        icon: node.metadata.icon,
        iconClassName: node.metadata.iconClassName,
        isDir:
          node.metadata.isDir ||
          node.title.includes("_+_") ||
          node.key.includes("_+_"),
        isConfirmation: node.metadata.isConfirmation,
        parentKey,
        description: node.metadata.description,
        imageUrl: node.metadata.imageUrl,
        imageClassName: node.metadata.imageClassName,
      };

      let currentRowIndex = rowIndex;

      // Process children if expanded
      if (hasChildren && isExpanded) {
        const children = node.children;

        // Helper function to get the base key (without _#N suffix)
        const getBaseKey = (key: string): string => {
          const match = key.match(/^(.+)_#\d+$/);
          return match ? match[1] : key;
        };

        // Helper function to check if a node is a template (addable but not an instance)
        const isTemplateNode = (child: TreeNode): boolean => {
          return child.metadata.isAddable === true && !child.key.includes("_#");
        };

        for (let i = 0; i < children.length; i++) {
          const child = children[i];

          // Skip rendering template nodes - we'll only show the Add button for them
          if (isTemplateNode(child)) {
            // Check if this template has any instances
            const hasInstances = children.some((c) =>
              c.key.startsWith(`${child.key}_#`)
            );

            if (!hasInstances) {
              // No instances yet, just show the button
              if (!rows[currentRowIndex]) {
                rows[currentRowIndex] = new Array(this.maxDepth).fill(null);
              }

              rows[currentRowIndex][level + 1] = {
                content:
                  child.metadata.addButtonLabel || `+ Add ${child.title}`,
                level: level + 1,
                rowIndex: currentRowIndex,
                nodeKey: `${child.key}_add_button`,
                hasChildren: false,
                isExpanded: false,
                isLeaf: true,
                isSelected: false,
                isAddButton: true,
                addButtonLabel: child.metadata.addButtonLabel,
                templateNodeKey: child.key,
                parentKey: node.key,
              };
              currentRowIndex++;
            }
            // If there are instances, we'll handle the button after the last instance below
            continue; // Skip to next child without incrementing currentRowIndex again
          }

          // Process non-template nodes normally
          currentRowIndex = processNode(
            child,
            level + 1,
            currentRowIndex,
            node.key
          );

          // Check if current child is an addable instance and if we should add a button after it
          if (child.metadata.isAddable && child.key.includes("_#")) {
            const currentBaseKey = getBaseKey(child.key);
            const nextChild = i < children.length - 1 ? children[i + 1] : null;

            // Add button if:
            // 1. There's no next child (we're at the end), OR
            // 2. Next child is not an instance of the same group
            const shouldAddButton =
              !nextChild ||
              getBaseKey(nextChild.key) !== currentBaseKey ||
              !nextChild.key.includes("_#");

            if (shouldAddButton) {
              // Find the template node for this group
              const templateNode = children.find(
                (c) =>
                  c.metadata.isAddable &&
                  getBaseKey(c.key) === currentBaseKey &&
                  !c.key.includes("_#")
              );

              if (templateNode) {
                currentRowIndex++;
                if (!rows[currentRowIndex]) {
                  rows[currentRowIndex] = new Array(this.maxDepth).fill(null);
                }

                rows[currentRowIndex][level + 1] = {
                  content:
                    templateNode.metadata.addButtonLabel ||
                    `+ Add ${templateNode.title}`,
                  level: level + 1,
                  rowIndex: currentRowIndex,
                  nodeKey: `${templateNode.key}_add_button`,
                  hasChildren: false,
                  isExpanded: false,
                  isLeaf: true,
                  isSelected: false,
                  isAddButton: true,
                  addButtonLabel: templateNode.metadata.addButtonLabel,
                  templateNodeKey: templateNode.key,
                  parentKey: node.key,
                };
              }
            }
          }

          if (i < children.length - 1) {
            currentRowIndex++;
          }
        }
      }

      // If node has an input field and is selected (leaf node), add input field in the next column
      if (
        node.metadata.inputField &&
        isSelected &&
        isLeaf &&
        level + 1 < this.maxDepth
      ) {
        if (!rows[rowIndex]) {
          rows[rowIndex] = new Array(this.maxDepth).fill(null);
        }

        rows[rowIndex][level + 1] = {
          content: "",
          level: level + 1,
          rowIndex,
          nodeKey: `${node.key}_input`,
          hasChildren: false,
          isExpanded: false,
          isLeaf: true,
          isSelected: false,
          inputField: node.metadata.inputField,
          parentKey: node.key,
        };
      }

      return currentRowIndex;
    };

    processNode(tree, 0, 0);
    return rows;
  }

  /**
   * Get the position (row, col) for a specific node key in the grid
   */
  getNodePosition(
    nodeKey: string,
    expandedKeys: Set<string>,
    selectedNodes: Set<string>
  ): { row: number; col: number } | null {
    const grid = this.toGrid(expandedKeys, selectedNodes);

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const cell = grid[row][col];
        if (cell && cell.nodeKey === nodeKey) {
          return { row, col };
        }
      }
    }

    return null;
  }
}
