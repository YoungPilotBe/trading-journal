import { useEffect, useMemo, useState } from "react";
import { InputField } from "./InputField";
import { ToggleBadge } from "./ToggleBadge";
import { strategyTree } from "./tree.constants";
import type { TreeNode } from "./tree.utils";
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
interface TreeState extends React.InputHTMLAttributes<HTMLDivElement> {
  expandedKeys: Set<string>; // Which branch nodes are expanded
  selectedNodes: Set<string>; // Which leaf nodes are selected
  tags: Record<string, unknown>; // JSON representation of selected tags
}

interface Props {
  initialTreeState: TreeState;
  onTreeStateChange?: (state: TreeState) => void;
  viewOnly?: boolean;
  strategy?: TreeNode[]; // Optional strategy tree, defaults to strategyTree
}

const Tree = ({
  initialTreeState,
  onTreeStateChange,
  viewOnly = false,
  strategy = strategyTree, // Default to the original strategyTree
  ...divProps
}: Props) => {
  // Initialize tree state - either from provided state or create default
  // Use useMemo to react to changes in initialTreeState
  const treeState = useMemo(() => {
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
  }, [initialTreeState]);

  // Use useState for internal state management
  const [internalTreeState, setInternalTreeState] =
    useState<TreeState>(treeState);

  // Sync internal state when treeState changes
  useEffect(() => {
    setInternalTreeState(treeState);
  }, [treeState]);

  const treeDepth = useMemo(() => getTreeDepthArray(strategy), [strategy]); // +1 for input fields
  const gridRows = useMemo(
    () =>
      flattenTreeArrayToGrid(
        strategy,
        internalTreeState.expandedKeys,
        internalTreeState.selectedNodes
      ),
    [strategy, internalTreeState.expandedKeys, internalTreeState.selectedNodes]
  );

  // Update internal state and notify parent of changes
  const updateTreeState = (
    newSelectedNodes: Set<string>,
    newExpandedKeys?: Set<string>
  ) => {
    const updatedState: TreeState = {
      expandedKeys: newExpandedKeys || internalTreeState.expandedKeys,
      selectedNodes: newSelectedNodes,
      tags: convertSelectionToJsonArray(strategy, newSelectedNodes),
    };

    setInternalTreeState(updatedState);
    if (onTreeStateChange) onTreeStateChange(updatedState);
  };

  // Unified handler for both branch and leaf nodes
  const handleNodeToggle = (
    nodeKey: string,
    isBranch: boolean,
    hasAntiSelection: boolean
  ) => {
    const result = toggleNodeArray(
      strategy,
      internalTreeState.selectedNodes,
      internalTreeState.expandedKeys,
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
    const newTags = { ...internalTreeState.tags };

    // Find the correct path to the node in the tree structure
    const nodePath = findNodePathArray(strategy, data.key);

    // Set the nested value using the utility function
    setNestedValue(newTags, nodePath, data.values, true);

    setInternalTreeState((prev) => ({ ...prev, tags: newTags }));
  };

  return (
    <div {...divProps}>
      {gridRows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`grid gap-2`}
          style={{
            gridTemplateColumns: `repeat(${treeDepth}, minmax(50px, 100px))`,
          }}
        >
          {row.map((cell, colIndex) => (
            <div key={colIndex} className="flex items-stretch w-full py-0.5">
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
                          strategy,
                          cell.parentKey
                        );
                        const existingData = getNestedValue(
                          internalTreeState.tags,
                          nodePath
                        );
                        return existingData?.value
                          ? String(existingData.value)
                          : "";
                      })()}
                      shouldFocus={internalTreeState.selectedNodes.has(
                        cell.parentKey
                      )}
                      onSave={handleInputFieldSave}
                      readOnly={viewOnly}
                    />
                  ) : cell.isLeaf ? (
                    <ToggleBadge
                      value={cell.isSelected || false}
                      onChange={() => {
                        const node = findNodeByKeyArray(strategy, cell.nodeKey);
                        const hasAntiSelection = Boolean(node?.anti?.length);
                        handleNodeToggle(cell.nodeKey, false, hasAntiSelection);
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
                        const node = findNodeByKeyArray(strategy, cell.nodeKey);
                        const hasAntiSelection = Boolean(node?.anti?.length);
                        return hasAntiSelection
                          ? cell.isSelected || false
                          : cell.isExpanded || false;
                      })()}
                      onChange={() => {
                        const node = findNodeByKeyArray(strategy, cell.nodeKey);
                        const hasAntiSelection = Boolean(node?.anti?.length);
                        handleNodeToggle(cell.nodeKey, true, hasAntiSelection);
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
  );
};

export default Tree;
export { Tree };
