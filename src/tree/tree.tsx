import { useMemo, useState } from "react";
import { ToggleBadge } from "./ToggleBadge";
import { strategyTree } from "./tree.constants";
import {
  flattenTreeToGrid,
  getBranchLength,
  toggleBranchSelectionWithChildren,
  toggleLeafSelectionWithAnti,
} from "./tree.utils";

const Tree = () => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    new Set(["strategy"])
  ); // Start with root expanded

  const [selectedLeaves, setSelectedLeaves] = useState<Set<string>>(new Set()); // Track selected leaves

  const branchLength = useMemo(() => getBranchLength(strategyTree), []);
  const gridRows = useMemo(
    () => flattenTreeToGrid(strategyTree, expandedKeys, selectedLeaves),
    [expandedKeys, selectedLeaves]
  );

  const handleToggle = (nodeKey: string) => {
    const result = toggleBranchSelectionWithChildren(
      strategyTree,
      selectedLeaves,
      expandedKeys,
      nodeKey
    );
    setExpandedKeys(result.expandedKeys);
    setSelectedLeaves(result.selectedLeaves);
  };

  const handleLeafSelection = (nodeKey: string) => {
    setSelectedLeaves((prev) =>
      toggleLeafSelectionWithAnti(strategyTree, prev, nodeKey)
    );
  };

  return (
    <div className="space-y-4">
      {/* Tree Grid */}
      <div className="border">
        {gridRows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`grid gap-1 border-b min-h-[40px]`}
            style={{
              gridTemplateColumns: `repeat(${branchLength}, minmax(0, 1fr))`,
            }}
          >
            {row.map((cell, colIndex) => (
              <div key={colIndex} className="border-r p-2 flex items-center">
                {cell && (
                  <div className="flex items-center gap-2 w-full">
                    {cell.isLeaf ? (
                      <div className="w-full">
                        <ToggleBadge
                          value={cell.isSelected || false}
                          onChange={() => handleLeafSelection(cell.nodeKey)}
                          label={cell.content}
                        />
                      </div>
                    ) : (
                      <div className="w-full">
                        <ToggleBadge
                          value={cell.isExpanded || false}
                          onChange={() => handleToggle(cell.nodeKey)}
                          label={cell.content}
                        />
                      </div>
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
