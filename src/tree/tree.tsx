import { useEffect, useMemo, useState } from "react";
import { ToggleBadge } from "./ToggleBadge";
import { strategyTree } from "./tree.constants";
import {
  convertSelectionToJson,
  findNodeByKey,
  flattenTreeToGrid,
  getBranchLength,
  toggleBranchSelectionWithAnti,
  toggleBranchSelectionWithChildren,
  toggleLeafSelectionWithAnti,
} from "./tree.utils";

const Tree = () => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    new Set(["strategy"])
  );

  const [selectedLeaves, setSelectedLeaves] = useState<Set<string>>(new Set()); // Track selected leaves

  const branchLength = useMemo(() => getBranchLength(strategyTree), []);
  const gridRows = useMemo(
    () => flattenTreeToGrid(strategyTree, expandedKeys, selectedLeaves),
    [expandedKeys, selectedLeaves]
  );

  // Convert selection to JSON whenever it changes
  const selectionJson = useMemo(() => {
    return convertSelectionToJson(strategyTree, selectedLeaves);
  }, [selectedLeaves]);

  // Log the JSON for demonstration (you can remove this)
  useEffect(() => {
    console.log("Current selection as JSON:", selectionJson);
  }, [selectionJson]);

  const handleToggle = (nodeKey: string) => {
    // Check if this branch has anti-selection properties
    const node = findNodeByKey(strategyTree, nodeKey);
    const hasAntiSelection = node?.anti && node.anti.length > 0;

    if (hasAntiSelection) {
      // Use anti-selection logic for branches with anti properties
      const result = toggleBranchSelectionWithAnti(
        strategyTree,
        selectedLeaves,
        expandedKeys,
        nodeKey
      );
      setExpandedKeys(result.expandedKeys);
      setSelectedLeaves(result.selectedLeaves);
    } else {
      // Use regular expansion logic for branches without anti properties
      const result = toggleBranchSelectionWithChildren(
        strategyTree,
        selectedLeaves,
        expandedKeys,
        nodeKey
      );
      setExpandedKeys(result.expandedKeys);
      setSelectedLeaves(result.selectedLeaves);
    }
  };

  useEffect(() => console.log({ expandedKeys }), [expandedKeys]);

  const handleLeafSelection = (nodeKey: string) => {
    setSelectedLeaves((prev) =>
      toggleLeafSelectionWithAnti(strategyTree, prev, nodeKey)
    );
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
              gridTemplateColumns: `repeat(${branchLength}, 100px)`,
            }}
          >
            {row.map((cell, colIndex) => (
              <div key={colIndex} className="flex items-stretch w-[100px]">
                {cell && (
                  <div className="w-full h-full p-0.5 flex items-center justify-center">
                    {cell.isLeaf ? (
                      <ToggleBadge
                        value={cell.isSelected || false}
                        onChange={() => handleLeafSelection(cell.nodeKey)}
                        label={cell.content}
                        fieldName={cell.nodeKey}
                      />
                    ) : (
                      (() => {
                        // For branches, check if they have anti-selection properties
                        const node = findNodeByKey(strategyTree, cell.nodeKey);
                        const hasAntiSelection =
                          node?.anti && node.anti.length > 0;

                        return (
                          <ToggleBadge
                            value={
                              hasAntiSelection
                                ? cell.isSelected || false
                                : cell.isExpanded || false
                            }
                            onChange={() => handleToggle(cell.nodeKey)}
                            label={cell.content}
                            fieldName={cell.nodeKey}
                          />
                        );
                      })()
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
