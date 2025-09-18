import { useEffect, useMemo, useState } from "react";
import { ToggleBadge } from "./ToggleBadge";
import { strategyTree } from "./tree.constants";
import {
  convertJsonToSelection,
  convertSelectionToJson,
  findNodeByKey,
  flattenTreeToGrid,
  getRequiredExpandedKeys,
  getTreeDepth,
  toggleBranchExpansion,
  toggleBranchWithAntiSelection,
  toggleLeafWithAntiSelection,
} from "./tree.utils";

interface Props {
  intialTree: Record<string, unknown>;
  onTreeChange: (tree: Record<string, unknown>) => void;
}

const Tree = ({ intialTree, onTreeChange }: Props) => {
  // Initialize selectedNodes from intialTree
  const initialSelectedNodes = useMemo(() => {
    if (intialTree && Object.keys(intialTree).length > 0) {
      return convertJsonToSelection(strategyTree, intialTree);
    }
    return new Set<string>();
  }, [intialTree]);

  // Calculate required expanded keys based on selected nodes
  const initialExpandedKeys = useMemo(() => {
    return getRequiredExpandedKeys(strategyTree, initialSelectedNodes);
  }, [initialSelectedNodes]);

  const [expandedKeys, setExpandedKeys] =
    useState<Set<string>>(initialExpandedKeys);
  const [selectedNodes, setSelectedNodes] =
    useState<Set<string>>(initialSelectedNodes);

  // Update both selectedNodes and expandedKeys when intialTree changes
  useEffect(() => {
    console.log("Tree initialization:", {
      intialTree,
      selectedNodes: Array.from(initialSelectedNodes),
      expandedKeys: Array.from(initialExpandedKeys),
    });
    setSelectedNodes(initialSelectedNodes);
    setExpandedKeys(initialExpandedKeys);
  }, [initialSelectedNodes, initialExpandedKeys, intialTree]);

  const treeDepth = useMemo(() => getTreeDepth(strategyTree), []);
  const gridRows = useMemo(
    () => flattenTreeToGrid(strategyTree, expandedKeys, selectedNodes),
    [expandedKeys, selectedNodes]
  );

  const handleBranchToggle = (nodeKey: string) => {
    const node = findNodeByKey(strategyTree, nodeKey);
    const hasAntiSelection = Boolean(node?.anti?.length);

    if (hasAntiSelection) {
      // Use anti-selection logic for branches with anti properties
      const result = toggleBranchWithAntiSelection(
        strategyTree,
        selectedNodes,
        expandedKeys,
        nodeKey
      );
      setExpandedKeys(result.expandedKeys);
      setSelectedNodes(result.selectedNodes);

      // Immediately notify parent of the change
      const newSelectionJson = convertSelectionToJson(
        strategyTree,
        result.selectedNodes
      );
      onTreeChange(newSelectionJson);
    } else {
      // Use regular expansion logic for branches without anti properties
      const result = toggleBranchExpansion(
        strategyTree,
        selectedNodes,
        expandedKeys,
        nodeKey
      );
      setExpandedKeys(result.expandedKeys);
      setSelectedNodes(result.selectedNodes);

      // Immediately notify parent of the change
      const newSelectionJson = convertSelectionToJson(
        strategyTree,
        result.selectedNodes
      );
      onTreeChange(newSelectionJson);
    }
  };

  const handleLeafToggle = (nodeKey: string) => {
    const newSelectedNodes = toggleLeafWithAntiSelection(
      strategyTree,
      selectedNodes,
      nodeKey
    );
    setSelectedNodes(newSelectedNodes);

    // Immediately notify parent of the change
    const newSelectionJson = convertSelectionToJson(
      strategyTree,
      newSelectedNodes
    );
    onTreeChange(newSelectionJson);
  };

  return (
    <div className="space-y-4">
      {/* Tree Grid */}
      <div className="">
        {gridRows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`grid gap-1`}
            style={{
              gridTemplateColumns: `repeat(${treeDepth}, 100px)`,
            }}
          >
            {row.map((cell, colIndex) => (
              <div key={colIndex} className="flex items-stretch w-[100px]">
                {cell && (
                  <div className="w-full h-full p-0.5 flex items-center justify-center">
                    {cell.isLeaf ? (
                      <ToggleBadge
                        value={cell.isSelected || false}
                        onChange={() => handleLeafToggle(cell.nodeKey)}
                        label={cell.content}
                        fieldName={cell.nodeKey}
                      />
                    ) : (
                      <ToggleBadge
                        value={(() => {
                          const node = findNodeByKey(
                            strategyTree,
                            cell.nodeKey
                          );
                          const hasAntiSelection = Boolean(node?.anti?.length);
                          return hasAntiSelection
                            ? cell.isSelected || false
                            : cell.isExpanded || false;
                        })()}
                        onChange={() => handleBranchToggle(cell.nodeKey)}
                        label={cell.content}
                        fieldName={cell.nodeKey}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tree;
