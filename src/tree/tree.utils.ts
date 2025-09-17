export type Branch = {
  key: string;
  title: string;
  children?: Branch[];
  anti?: string[]; // Array of keys that should be deselected when this item is selected
};

function getBranchLength(tree: Branch): number {
  // Base case: if no children, this branch has length 1 (just itself)
  if (!tree.children || tree.children.length === 0) {
    return 1;
  }

  // Recursively find the maximum depth among all children
  let maxChildDepth = 0;
  for (const child of tree.children) {
    const childDepth = getBranchLength(child);
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }

  // Add 1 for the current level
  return maxChildDepth + 1;
}

// Function to flatten tree into grid rows with expansion state
type GridCell = {
  content: string;
  level: number;
  rowIndex: number;
  nodeKey: string;
  hasChildren: boolean;
  isExpanded?: boolean;
  isLeaf: boolean;
  isSelected?: boolean;
};

function flattenTreeToGrid(
  tree: Branch,
  expandedKeys: Set<string> = new Set(),
  selectedLeaves: Set<string> = new Set()
): GridCell[][] {
  const rows: GridCell[][] = [];
  const maxDepth = getBranchLength(tree);

  function processNode(node: Branch, level: number, rowIndex: number): number {
    // Ensure the row exists
    if (!rows[rowIndex]) {
      rows[rowIndex] = new Array(maxDepth).fill(null);
    }

    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedKeys.has(node.key);
    const isLeaf = !hasChildren;
    const isSelected = selectedLeaves.has(node.key);

    // Place the current node in the grid
    rows[rowIndex][level] = {
      content: node.title,
      level,
      rowIndex,
      nodeKey: node.key,
      hasChildren: !!hasChildren,
      isExpanded,
      isLeaf,
      isSelected,
    };

    let currentRowIndex = rowIndex;

    // Process children only if this node is expanded
    if (hasChildren && isExpanded) {
      for (let i = 0; i < node.children!.length; i++) {
        const child = node.children![i];
        currentRowIndex = processNode(child, level + 1, currentRowIndex);
        // Move to next row for the next child (except for the last one)
        if (i < node.children!.length - 1) {
          currentRowIndex++;
        }
      }
    }

    return currentRowIndex;
  }

  processNode(tree, 0, 0);
  return rows;
}

// Helper function to toggle expansion state
function toggleExpansion(
  expandedKeys: Set<string>,
  nodeKey: string
): Set<string> {
  const newExpandedKeys = new Set(expandedKeys);
  if (newExpandedKeys.has(nodeKey)) {
    newExpandedKeys.delete(nodeKey);
  } else {
    newExpandedKeys.add(nodeKey);
  }
  return newExpandedKeys;
}

// Helper function to find path from root to a specific node
function findPathToNode(tree: Branch, targetKey: string): string[] {
  function searchNode(node: Branch, path: string[]): string[] | null {
    const currentPath = [...path, node.key];

    if (node.key === targetKey) {
      return currentPath;
    }

    if (node.children) {
      for (const child of node.children) {
        const result = searchNode(child, currentPath);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  return searchNode(tree, []) || [];
}

// Helper function to check if a node is a leaf (has no children)
function isLeafNode(tree: Branch, nodeKey: string): boolean {
  function findNode(node: Branch): boolean | null {
    if (node.key === nodeKey) {
      return !node.children || node.children.length === 0;
    }

    if (node.children) {
      for (const child of node.children) {
        const result = findNode(child);
        if (result !== null) {
          return result;
        }
      }
    }

    return null;
  }

  return findNode(tree) || false;
}

// Helper function to construct selection object from selected leaves
function constructSelectionObject(
  tree: Branch,
  selectedLeaves: Set<string>
): Record<string, unknown> {
  const selectionObject: Record<string, unknown> = {};

  selectedLeaves.forEach((leafKey) => {
    const path = findPathToNode(tree, leafKey);
    if (path.length > 0) {
      // Remove the root from the path and reverse it so leaf is the key
      const pathWithoutRoot = path.slice(1); // Remove root

      if (pathWithoutRoot.length > 0) {
        const leafName = pathWithoutRoot[pathWithoutRoot.length - 1];
        const parentPath = pathWithoutRoot.slice(0, -1);

        // Build nested object structure
        let current: Record<string, unknown> = selectionObject;
        for (const segment of parentPath) {
          if (!current[segment]) {
            current[segment] = {};
          }
          current = current[segment] as Record<string, unknown>;
        }
        current[leafName] = true;
      }
    }
  });

  return selectionObject;
}

// Helper function to find a node's anti array
function findNodeAnti(tree: Branch, nodeKey: string): string[] {
  function searchNode(node: Branch): string[] | null {
    if (node.key === nodeKey) {
      return node.anti || [];
    }

    if (node.children) {
      for (const child of node.children) {
        const result = searchNode(child);
        if (result !== null) {
          return result;
        }
      }
    }

    return null;
  }

  return searchNode(tree) || [];
}

// Helper function to toggle leaf selection with anti-selection logic
function toggleLeafSelection(
  selectedLeaves: Set<string>,
  nodeKey: string
): Set<string> {
  const newSelectedLeaves = new Set(selectedLeaves);
  if (newSelectedLeaves.has(nodeKey)) {
    newSelectedLeaves.delete(nodeKey);
  } else {
    newSelectedLeaves.add(nodeKey);
  }
  return newSelectedLeaves;
}

// Helper function to get all descendant keys from a node
function getAllDescendantKeys(node: Branch): string[] {
  const descendants: string[] = [];

  function collectDescendants(currentNode: Branch) {
    if (currentNode.children) {
      for (const child of currentNode.children) {
        descendants.push(child.key);
        collectDescendants(child);
      }
    }
  }

  collectDescendants(node);
  return descendants;
}

// Helper function to find a node by key
function findNodeByKey(tree: Branch, nodeKey: string): Branch | null {
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

// Helper function to toggle leaf selection with anti-selection logic
function toggleLeafSelectionWithAnti(
  tree: Branch,
  selectedLeaves: Set<string>,
  nodeKey: string
): Set<string> {
  const newSelectedLeaves = new Set(selectedLeaves);

  if (newSelectedLeaves.has(nodeKey)) {
    // If already selected, just deselect it
    newSelectedLeaves.delete(nodeKey);
  } else {
    // If not selected, select it and deselect any anti items
    newSelectedLeaves.add(nodeKey);

    // Find and deselect anti items
    const antiKeys = findNodeAnti(tree, nodeKey);
    antiKeys.forEach((antiKey) => {
      newSelectedLeaves.delete(antiKey);
    });
  }

  return newSelectedLeaves;
}

// Helper function to toggle branch selection with child deselection logic
function toggleBranchSelectionWithChildren(
  tree: Branch,
  selectedLeaves: Set<string>,
  expandedKeys: Set<string>,
  nodeKey: string
): { selectedLeaves: Set<string>; expandedKeys: Set<string> } {
  const newSelectedLeaves = new Set(selectedLeaves);
  const newExpandedKeys = new Set(expandedKeys);

  // Find the node
  const node = findNodeByKey(tree, nodeKey);
  if (!node) {
    return { selectedLeaves: newSelectedLeaves, expandedKeys: newExpandedKeys };
  }

  // Toggle expansion
  if (newExpandedKeys.has(nodeKey)) {
    newExpandedKeys.delete(nodeKey);

    // When collapsing a branch, deselect all its descendants (both leaves and branches)
    const descendantKeys = getAllDescendantKeys(node);
    descendantKeys.forEach((descendantKey) => {
      newSelectedLeaves.delete(descendantKey);
      // Also remove from expanded keys if it was a branch
      newExpandedKeys.delete(descendantKey);
    });
  } else {
    newExpandedKeys.add(nodeKey);
  }

  return { selectedLeaves: newSelectedLeaves, expandedKeys: newExpandedKeys };
}

export {
  constructSelectionObject,
  findPathToNode,
  flattenTreeToGrid,
  getBranchLength,
  isLeafNode,
  toggleBranchSelectionWithChildren,
  toggleExpansion,
  toggleLeafSelection,
  toggleLeafSelectionWithAnti,
};
