import { useEffect, useMemo, useState } from "react";
import { ToggleBadge } from "./ToggleBadge";
import { strategyTree } from "./tree.constants";
import {
  convertSelectionToJson,
  findNodeByKey,
  flattenTreeToGrid,
  getTreeDepth,
  toggleBranchExpansion,
  toggleBranchWithAntiSelection,
  toggleLeafWithAntiSelection,
} from "./tree.utils";

interface TreeState {
  expandedKeys: Set<string>;
  selectedNodes: Set<string>;
  tags: Record<string, unknown>;
}

interface Props {
  initialTreeState?: TreeState;
  onTreeStateChange: (state: TreeState) => void;
}

const Tree = ({ initialTreeState, onTreeStateChange }: Props) => {
  // Initialize tree state - either from provided state or create default
  const [treeState, setTreeState] = useState<TreeState>(() => {
    if (initialTreeState) {
      // Ensure strategy is always expanded
      const expandedKeys = new Set(initialTreeState.expandedKeys);
      expandedKeys.add("strategy");
      return {
        ...initialTreeState,
        expandedKeys,
      };
    }

    // Default state for new tree
    return {
      expandedKeys: new Set<string>(["strategy"]),
      selectedNodes: new Set<string>(),
      tags: {},
    };
  });

  // Update tree state when initialTreeState changes
  useEffect(() => {
    if (initialTreeState) {
      const expandedKeys = new Set(initialTreeState.expandedKeys);
      expandedKeys.add("strategy"); // Always ensure strategy is expanded

      setTreeState({
        ...initialTreeState,
        expandedKeys,
      });
    }
  }, [initialTreeState]);

  const treeDepth = useMemo(() => getTreeDepth(strategyTree), []);
  const gridRows = useMemo(
    () =>
      flattenTreeToGrid(
        strategyTree,
        treeState.expandedKeys,
        treeState.selectedNodes
      ),
    [treeState.expandedKeys, treeState.selectedNodes]
  );

  const updateTreeState = (
    newSelectedNodes: Set<string>,
    newExpandedKeys?: Set<string>
  ) => {
    const updatedState: TreeState = {
      expandedKeys: newExpandedKeys || treeState.expandedKeys,
      selectedNodes: newSelectedNodes,
      tags: convertSelectionToJson(strategyTree, newSelectedNodes),
    };

    setTreeState(updatedState);
    onTreeStateChange(updatedState);
  };

  const handleBranchToggle = (nodeKey: string) => {
    const node = findNodeByKey(strategyTree, nodeKey);
    const hasAntiSelection = Boolean(node?.anti?.length);

    const result = hasAntiSelection
      ? toggleBranchWithAntiSelection(
          strategyTree,
          treeState.selectedNodes,
          treeState.expandedKeys,
          nodeKey
        )
      : toggleBranchExpansion(
          strategyTree,
          treeState.selectedNodes,
          treeState.expandedKeys,
          nodeKey
        );

    updateTreeState(result.selectedNodes, result.expandedKeys);
  };

  const handleLeafToggle = (nodeKey: string) => {
    const newSelectedNodes = toggleLeafWithAntiSelection(
      strategyTree,
      treeState.selectedNodes,
      nodeKey
    );
    updateTreeState(newSelectedNodes);
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
export { Tree };
