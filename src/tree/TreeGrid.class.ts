/**
 * TreeGrid Class - Handles grid positioning and rendering layout
 *
 * This class is responsible for:
 * - Computing grid positions (row, col) for each node
 * - Managing expanded/collapsed state visualization
 * - Flattening tree structure into a 2D grid for rendering
 */

import type { TreeNodeMetadata } from "./TreeNode.class";
import { TreeNode } from "./TreeNode.class";

/**
 * Represents a cell in the grid
 */
export interface GridCell {
  content: string;
  level: number;
  rowIndex: number;
  nodePath: string;
  hasChildren: boolean;
  isExpanded: boolean;
  isLeaf: boolean;
  isSelected: boolean;
  parentPath?: string;
  metadata: TreeNodeMetadata;
  // Dynamic node creation
  isAddButton?: boolean;
  addButtonLabel?: string;
  templateNodePath?: string;
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
  toGrid(expandedPaths: Set<string>, selectedPaths: Set<string>): GridCell[][] {
    const allRows: GridCell[][] = [];
    let currentRowIndex = 0;

    for (const tree of this.trees) {
      const treeRows = this.flattenTreeToGrid(
        tree,
        expandedPaths,
        selectedPaths
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
    expandedPaths: Set<string>,
    selectedPaths: Set<string>
  ): GridCell[][] {
    const rows: GridCell[][] = [];

    const processNode = (
      node: TreeNode,
      level: number,
      rowIndex: number,
      parentPath?: string
    ): number => {
      if (!rows[rowIndex]) {
        rows[rowIndex] = new Array(this.maxDepth).fill(null);
      }

      const hasChildren = node.hasChildren;
      const isExpanded = expandedPaths.has(node.path);
      const isLeaf = node.isLeaf;
      const isSelected = selectedPaths.has(node.path);

      rows[rowIndex][level] = {
        content: node.title,
        level,
        rowIndex,
        nodePath: node.path,
        hasChildren,
        isExpanded,
        isLeaf,
        isSelected,
        parentPath,
        metadata: node.metadata,
      };

      let currentRowIndex = rowIndex;

      // Process children if expanded
      if (hasChildren && isExpanded) {
        const children = node.children;

        // Helper function to check if a path contains dynamic instance notation
        const isDynamicInstance = (path: string): boolean => {
          return path.includes(".[#");
        };

        // Helper function to check if a node is a template (addable but not an instance)
        const isTemplateNode = (child: TreeNode): boolean => {
          return (
            child.metadata.isAddable === true && !isDynamicInstance(child.path)
          );
        };

        for (let i = 0; i < children.length; i++) {
          const child = children[i];

          // Skip rendering template nodes - we'll only show the Add button for them
          if (isTemplateNode(child)) {
            // Check if this template has any instances
            const hasInstances = children.some(
              (c) => c.key === child.key && isDynamicInstance(c.path)
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
                nodePath: `${child.path}_add_button`,
                hasChildren: false,
                isExpanded: false,
                isLeaf: true,
                isSelected: false,
                parentPath: node.path,
                metadata: child.metadata,
                isAddButton: true,
                addButtonLabel: child.metadata.addButtonLabel,
                templateNodePath: child.path,
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
            node.path
          );

          // Check if current child is a dynamic instance and if we should add a button after it
          if (isDynamicInstance(child.path)) {
            const currentBaseKey = child.key;

            // Find the template node for this group to check if it's addable
            const templateNode = children.find(
              (c) =>
                c.metadata.isAddable &&
                c.key === currentBaseKey &&
                !isDynamicInstance(c.path)
            );

            // Only add button if the template exists and is addable
            if (templateNode) {
              const nextChild =
                i < children.length - 1 ? children[i + 1] : null;

              // Add button if:
              // 1. There's no next child (we're at the end), OR
              // 2. Next child has a different key (different group)
              const shouldAddButton =
                !nextChild ||
                nextChild.key !== currentBaseKey ||
                !isDynamicInstance(nextChild.path);

              if (shouldAddButton) {
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
                  nodePath: `${templateNode.path}_add_button`,
                  hasChildren: false,
                  isExpanded: false,
                  isLeaf: true,
                  isSelected: false,
                  parentPath: node.path,
                  metadata: templateNode.metadata,
                  isAddButton: true,
                  addButtonLabel: templateNode.metadata.addButtonLabel,
                  templateNodePath: templateNode.path,
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
          nodePath: `${node.path}_input`,
          hasChildren: false,
          isExpanded: false,
          isLeaf: true,
          isSelected: false,
          parentPath: node.path,
          metadata: node.metadata,
        };
      }

      return currentRowIndex;
    };

    processNode(tree, 0, 0);
    return rows;
  }

  /**
   * Get the position (row, col) for a specific node path in the grid
   */
  getNodePosition(
    nodePath: string,
    expandedPaths: Set<string>,
    selectedPaths: Set<string>
  ): { row: number; col: number } | null {
    const grid = this.toGrid(expandedPaths, selectedPaths);

    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const cell = grid[row][col];
        if (cell && cell.nodePath === nodePath) {
          return { row, col };
        }
      }
    }

    return null;
  }
}
