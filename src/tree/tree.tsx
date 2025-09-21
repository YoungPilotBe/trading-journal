import { useMemo, useState } from "react";
import { InputField } from "./InputField";
import { ToggleBadge } from "./ToggleBadge";
import { strategyTree } from "./tree.constants";
import {
  convertSelectionToJsonArray,
  findNodeByKeyArray,
  findNodePathArray,
  flattenTreeArrayToGrid,
  getNestedValue,
  getTreeDepthArray,
  setNestedValue,
  toggleNodeArray,
} from "./tree.utils";

// Complete tree state that includes both UI state and data
interface TreeState {
  expandedKeys: Set<string>; // Which branch nodes are expanded
  selectedNodes: Set<string>; // Which leaf nodes are selected
  tags: Record<string, unknown>; // JSON representation of selected tags
}

interface Props {
  initialTreeState: TreeState;
  onTreeStateChange?: (state: TreeState) => void;
  viewOnly?: boolean;
}

const Tree = ({
  initialTreeState,
  onTreeStateChange,
  viewOnly = false,
}: Props) => {
  // Initialize tree state - either from provided state or create default
  const [treeState, setTreeState] = useState<TreeState>(() => {
    if (initialTreeState) {
      return {
        ...initialTreeState,
      };
    }

    // Default state for new tree
    return {
      expandedKeys: new Set<string>(),
      selectedNodes: new Set<string>(),
      tags: {},
    };
  });

  const treeDepth = useMemo(() => getTreeDepthArray(strategyTree) + 1, []); // +1 for input fields
  const gridRows = useMemo(
    () =>
      flattenTreeArrayToGrid(
        strategyTree,
        treeState.expandedKeys,
        treeState.selectedNodes
      ),
    [treeState.expandedKeys, treeState.selectedNodes]
  );

  // Update internal state and notify parent of changes
  const updateTreeState = (
    newSelectedNodes: Set<string>,
    newExpandedKeys?: Set<string>
  ) => {
    const updatedState: TreeState = {
      expandedKeys: newExpandedKeys || treeState.expandedKeys,
      selectedNodes: newSelectedNodes,
      tags: convertSelectionToJsonArray(strategyTree, newSelectedNodes),
    };

    setTreeState(updatedState);
    if (onTreeStateChange) onTreeStateChange(updatedState);
  };

  // Unified handler for both branch and leaf nodes
  const handleNodeToggle = (
    nodeKey: string,
    isBranch: boolean,
    hasAntiSelection: boolean
  ) => {
    const result = toggleNodeArray(
      strategyTree,
      treeState.selectedNodes,
      treeState.expandedKeys,
      nodeKey,
      isBranch,
      hasAntiSelection
    );
    updateTreeState(result.selectedNodes, result.expandedKeys);
  };

  // Handler for saving input field data
  const handleInputFieldSave = (data: {
    key: string;
    values: Record<string, unknown>;
  }) => {
    const newTags = { ...treeState.tags };

    // Find the correct path to the node in the tree structure
    const nodePath = findNodePathArray(strategyTree, data.key);

    // Set the nested value using the utility function
    setNestedValue(newTags, nodePath, data.values, true);

    setTreeState((prev) => ({ ...prev, tags: newTags }));
  };

  return (
    <div className="space-y-4">
      {/* Tree Grid */}
      <div className="">
        {gridRows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`grid gap-2`}
            style={{
              gridTemplateColumns: `repeat(${treeDepth}, 100px)`,
            }}
          >
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className="flex items-stretch w-[100px] py-0.5"
              >
                {cell && (
                  <>
                    {cell.inputField && cell.parentKey ? (
                      <InputField
                        config={cell.inputField}
                        parentKey={cell.parentKey}
                        fieldName={cell.nodeKey.replace("_input", "")}
                        initialValue={(() => {
                          // Extract existing value from tags
                          const nodePath = findNodePathArray(
                            strategyTree,
                            cell.parentKey
                          );
                          const existingData = getNestedValue(
                            treeState.tags,
                            nodePath
                          );
                          return existingData?.value
                            ? String(existingData.value)
                            : "";
                        })()}
                        shouldFocus={treeState.selectedNodes.has(
                          cell.parentKey
                        )}
                        onSave={handleInputFieldSave}
                        readOnly={viewOnly}
                      />
                    ) : cell.isLeaf ? (
                      <ToggleBadge
                        value={cell.isSelected || false}
                        onChange={() => {
                          const node = findNodeByKeyArray(
                            strategyTree,
                            cell.nodeKey
                          );
                          const hasAntiSelection = Boolean(node?.anti?.length);
                          handleNodeToggle(
                            cell.nodeKey,
                            false,
                            hasAntiSelection
                          );
                        }}
                        label={cell.content}
                        fieldName={cell.nodeKey}
                        icon={cell.icon}
                        iconClassName={cell.iconClassName}
                        isDir={cell.isDir}
                        readOnly={viewOnly}
                      />
                    ) : (
                      <ToggleBadge
                        value={(() => {
                          const node = findNodeByKeyArray(
                            strategyTree,
                            cell.nodeKey
                          );
                          const hasAntiSelection = Boolean(node?.anti?.length);
                          return hasAntiSelection
                            ? cell.isSelected || false
                            : cell.isExpanded || false;
                        })()}
                        onChange={() => {
                          const node = findNodeByKeyArray(
                            strategyTree,
                            cell.nodeKey
                          );
                          const hasAntiSelection = Boolean(node?.anti?.length);
                          handleNodeToggle(
                            cell.nodeKey,
                            true,
                            hasAntiSelection
                          );
                        }}
                        label={cell.content}
                        fieldName={cell.nodeKey}
                        icon={cell.icon}
                        iconClassName={cell.iconClassName}
                        isDir={cell.isDir}
                        readOnly={viewOnly}
                      />
                    )}
                  </>
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
