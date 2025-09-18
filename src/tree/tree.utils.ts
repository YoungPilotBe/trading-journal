export type TreeNode = {
  key: string;
  title: string;
  children?: TreeNode[];
  anti?: string[]; // Keys that should be deselected when this item is selected
};

function getTreeDepth(tree: TreeNode): number {
  if (!tree.children || tree.children.length === 0) {
    return 1;
  }

  let maxChildDepth = 0;
  for (const child of tree.children) {
    const childDepth = getTreeDepth(child);
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }

  return maxChildDepth + 1;
}

export type GridCell = {
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
  tree: TreeNode,
  expandedKeys: Set<string> = new Set(),
  selectedNodes: Set<string> = new Set()
): GridCell[][] {
  const rows: GridCell[][] = [];
  const maxDepth = getTreeDepth(tree);

  function processNode(
    node: TreeNode,
    level: number,
    rowIndex: number
  ): number {
    if (!rows[rowIndex]) {
      rows[rowIndex] = new Array(maxDepth).fill(null);
    }

    const hasChildren = Boolean(node.children?.length);
    const isExpanded = expandedKeys.has(node.key);
    const isLeaf = !hasChildren;
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
    };

    let currentRowIndex = rowIndex;

    if (hasChildren && isExpanded) {
      for (let i = 0; i < node.children!.length; i++) {
        const child = node.children![i];
        currentRowIndex = processNode(child, level + 1, currentRowIndex);
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

function findNodePath(tree: TreeNode, targetKey: string): string[] {
  function search(node: TreeNode, path: string[]): string[] | null {
    const currentPath = [...path, node.key];

    if (node.key === targetKey) {
      return currentPath;
    }

    if (node.children) {
      for (const child of node.children) {
        const result = search(child, currentPath);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }

  return search(tree, []) || [];
}

function getNodeAntiKeys(tree: TreeNode, nodeKey: string): string[] {
  function search(node: TreeNode): string[] | null {
    if (node.key === nodeKey) {
      return node.anti || [];
    }

    if (node.children) {
      for (const child of node.children) {
        const result = search(child);
        if (result !== null) {
          return result;
        }
      }
    }

    return null;
  }

  return search(tree) || [];
}

function getAllDescendantKeys(node: TreeNode): string[] {
  const descendants: string[] = [];

  function collect(currentNode: TreeNode) {
    if (currentNode.children) {
      for (const child of currentNode.children) {
        descendants.push(child.key);
        collect(child);
      }
    }
  }

  collect(node);
  return descendants;
}

function findNodeByKey(tree: TreeNode, nodeKey: string): TreeNode | null {
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

function toggleNodeWithAntiSelection(
  tree: TreeNode,
  selectedNodes: Set<string>,
  nodeKey: string
): Set<string> {
  const newSelectedNodes = new Set(selectedNodes);

  if (newSelectedNodes.has(nodeKey)) {
    newSelectedNodes.delete(nodeKey);
  } else {
    newSelectedNodes.add(nodeKey);

    // Handle anti-selection logic
    const antiKeys = getNodeAntiKeys(tree, nodeKey);
    antiKeys.forEach((antiKey) => {
      newSelectedNodes.delete(antiKey);

      // If the anti item is a branch, also deselect all its descendants
      const antiNode = findNodeByKey(tree, antiKey);
      if (antiNode?.children) {
        const descendantKeys = getAllDescendantKeys(antiNode);
        descendantKeys.forEach((descendantKey) => {
          newSelectedNodes.delete(descendantKey);
        });
      }
    });
  }

  return newSelectedNodes;
}

function toggleLeafWithAntiSelection(
  tree: TreeNode,
  selectedNodes: Set<string>,
  nodeKey: string
): Set<string> {
  return toggleNodeWithAntiSelection(tree, selectedNodes, nodeKey);
}

function toggleBranchWithAntiSelection(
  tree: TreeNode,
  selectedNodes: Set<string>,
  expandedKeys: Set<string>,
  nodeKey: string
): { selectedNodes: Set<string>; expandedKeys: Set<string> } {
  const newSelectedNodes = new Set(selectedNodes);
  const newExpandedKeys = new Set(expandedKeys);

  const node = findNodeByKey(tree, nodeKey);
  if (!node) {
    return { selectedNodes: newSelectedNodes, expandedKeys: newExpandedKeys };
  }

  const wasSelected = newSelectedNodes.has(nodeKey);

  if (wasSelected) {
    // Deselect and collapse
    newSelectedNodes.delete(nodeKey);
    newExpandedKeys.delete(nodeKey);

    // Also collapse and deselect all descendants
    const descendantKeys = getAllDescendantKeys(node);
    descendantKeys.forEach((descendantKey) => {
      newSelectedNodes.delete(descendantKey);
      newExpandedKeys.delete(descendantKey);
    });
  } else {
    // Select and handle anti-logic
    newSelectedNodes.add(nodeKey);

    // Handle anti-selection
    const antiKeys = getNodeAntiKeys(tree, nodeKey);
    antiKeys.forEach((antiKey) => {
      newSelectedNodes.delete(antiKey);
      newExpandedKeys.delete(antiKey);

      const antiNode = findNodeByKey(tree, antiKey);
      if (antiNode?.children) {
        const descendantKeys = getAllDescendantKeys(antiNode);
        descendantKeys.forEach((descendantKey) => {
          newSelectedNodes.delete(descendantKey);
          newExpandedKeys.delete(descendantKey);
        });
      }
    });

    // Expand if has children
    if (node.children?.length) {
      newExpandedKeys.add(nodeKey);
    }
  }

  return { selectedNodes: newSelectedNodes, expandedKeys: newExpandedKeys };
}

function toggleBranchExpansion(
  tree: TreeNode,
  selectedNodes: Set<string>,
  expandedKeys: Set<string>,
  nodeKey: string
): { selectedNodes: Set<string>; expandedKeys: Set<string> } {
  const newSelectedNodes = new Set(selectedNodes);
  const newExpandedKeys = new Set(expandedKeys);

  const node = findNodeByKey(tree, nodeKey);
  if (!node) {
    return { selectedNodes: newSelectedNodes, expandedKeys: newExpandedKeys };
  }

  // Toggle expansion
  if (newExpandedKeys.has(nodeKey)) {
    newExpandedKeys.delete(nodeKey);

    // When collapsing, deselect all descendants
    const descendantKeys = getAllDescendantKeys(node);
    descendantKeys.forEach((descendantKey) => {
      newSelectedNodes.delete(descendantKey);
      newExpandedKeys.delete(descendantKey);
    });
  } else {
    newExpandedKeys.add(nodeKey);
  }

  return { selectedNodes: newSelectedNodes, expandedKeys: newExpandedKeys };
}

function convertSelectionToJson(
  tree: TreeNode,
  selectedNodes: Set<string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  selectedNodes.forEach((nodeKey) => {
    const path = findNodePath(tree, nodeKey);
    if (path.length > 0) {
      // Remove the root from the path
      const pathWithoutRoot = path.slice(1);

      if (pathWithoutRoot.length > 0) {
        // Build nested object structure
        let current: Record<string, unknown> = result;

        // Navigate/create the nested structure
        for (let i = 0; i < pathWithoutRoot.length - 1; i++) {
          const segment = pathWithoutRoot[i];

          // If the current segment is already set to true (boolean),
          // we need to convert it to an object to add children
          if (current[segment] === true) {
            current[segment] = {};
          } else if (
            !current[segment] ||
            typeof current[segment] !== "object"
          ) {
            current[segment] = {};
          }

          current = current[segment] as Record<string, unknown>;
        }

        // Set the final node to true
        const nodeName = pathWithoutRoot[pathWithoutRoot.length - 1];
        current[nodeName] = true;
      }
    }
  });

  return result;
}

function convertJsonToSelection(
  tree: TreeNode,
  json: Record<string, unknown>
): Set<string> {
  const selectedNodes = new Set<string>();

  function traverse(obj: Record<string, unknown>, currentPath: string[] = []) {
    for (const [key, value] of Object.entries(obj)) {
      const path = [...currentPath, key];

      if (value === true) {
        // This is a selected leaf node, find its nodeKey
        const nodeKey = findNodeKeyByPath(tree, path);
        if (nodeKey) {
          selectedNodes.add(nodeKey);
        }
      } else if (typeof value === "object" && value !== null) {
        // This is a branch, continue traversing
        traverse(value as Record<string, unknown>, path);
      }
    }
  }

  traverse(json);
  return selectedNodes;
}

function findNodeKeyByPath(tree: TreeNode, path: string[]): string | null {
  function search(node: TreeNode, remainingPath: string[]): string | null {
    if (remainingPath.length === 0) {
      return node.key;
    }

    const [currentSegment, ...restPath] = remainingPath;

    // Match against the node's key
    if (node.key === currentSegment) {
      if (restPath.length === 0) {
        return node.key;
      }

      if (node.children) {
        for (const child of node.children) {
          const result = search(child, restPath);
          if (result) return result;
        }
      }
    }

    // If we're at the root and didn't match, try searching children directly
    // This handles the case where the JSON path doesn't include the root
    if (node.key === "strategy" && node.children) {
      for (const child of node.children) {
        const result = search(child, remainingPath);
        if (result) return result;
      }
    }

    return null;
  }

  return search(tree, path);
}

function getRequiredExpandedKeys(
  tree: TreeNode,
  selectedNodes: Set<string>
): Set<string> {
  const expandedKeys = new Set<string>(["strategy"]); // Always include root

  selectedNodes.forEach((nodeKey) => {
    const path = findNodePath(tree, nodeKey);
    // Add all parent nodes (except the leaf node itself) to expandedKeys
    for (let i = 0; i < path.length - 1; i++) {
      expandedKeys.add(path[i]);
    }
  });

  return expandedKeys;
}

export {
  convertJsonToSelection,
  convertSelectionToJson,
  findNodeByKey,
  flattenTreeToGrid,
  getRequiredExpandedKeys,
  getTreeDepth,
  toggleBranchExpansion,
  toggleBranchWithAntiSelection,
  toggleLeafWithAntiSelection,
};
