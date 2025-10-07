/**
 * Tree Component (Class-Based Version)
 *
 * Renders a dynamic tree structure with support for branches, leaves, and input fields.
 * Uses class-based TreeNode, TreeState, and TreeGrid for better encapsulation.
 *
 * Usage:
 *
 * @example
 * ```tsx
 * import { TreeProvider } from './TreeContext'
 * import { Tree } from './tree'
 * import { createIdeaStrategyTree } from './strategies/idea.constants'
 *
 * function MyComponent() {
 *   const trees = createIdeaStrategyTree({
 *     availableTimeframes: ['1m', '5m', '15m']
 *   })
 *
 *   return (
 *     <TreeProvider tradeSetup={tradeSetup} trees={trees}>
 *       <Tree />
 *     </TreeProvider>
 *   )
 * }
 * ```
 */

import { useMemo } from "react";
import { AddNodeButton } from "./AddNodeButton";
import { InputField } from "./InputField";
import { ToggleBadge } from "./ToggleBadge";
import {
  useTreeActions,
  useTreeManagers,
  useTreeStateValue,
} from "./TreeContext.new";
import { findNodePathArray } from "./tree.utils.new";

interface Props extends React.InputHTMLAttributes<HTMLDivElement> {}

export const Tree = ({ ...divProps }: Props) => {
  // Get tree managers and state from context
  const { trees, treeState, treeGrid } = useTreeManagers();
  const { saveInputField } = useTreeActions();
  const currentState = useTreeStateValue();

  // Get max depth for grid columns
  const maxDepth = useMemo(() => treeGrid.getMaxDepth(), [treeGrid]);

  // Flatten tree to grid
  const gridRows = useMemo(
    () =>
      treeGrid.toGrid(currentState.expandedKeys, currentState.selectedNodes),
    [treeGrid, currentState.expandedKeys, currentState.selectedNodes]
  );

  return (
    <div {...divProps}>
      {gridRows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${maxDepth}, minmax(100px, 150px))`,
          }}
        >
          {row.map((cell, colIndex) => (
            <div key={colIndex} className="flex items-stretch w-full py-0.5">
              {cell && (
                <>
                  {cell.isAddButton && cell.templateNodeKey ? (
                    <AddNodeButton
                      templateNodeKey={cell.templateNodeKey}
                      label={cell.addButtonLabel || cell.content}
                    />
                  ) : cell.inputField && cell.parentKey ? (
                    <InputField
                      config={cell.inputField}
                      parentKey={cell.parentKey}
                      fieldName={cell.nodeKey.replace("_input", "")}
                      initialValue={(() => {
                        // Extract existing value from tags
                        const nodePath = findNodePathArray(
                          trees,
                          cell.parentKey
                        );
                        const existingData = treeState.getNestedValue(nodePath);
                        return existingData?.value
                          ? String(existingData.value)
                          : "";
                      })()}
                      shouldFocus={currentState.selectedNodes.has(
                        cell.parentKey
                      )}
                      onSave={saveInputField}
                    />
                  ) : cell.isLeaf ? (
                    <ToggleBadge
                      label={cell.content}
                      fieldName={cell.nodeKey}
                      isBranch={false}
                      {...cell}
                    />
                  ) : (
                    <ToggleBadge
                      label={cell.content}
                      fieldName={cell.nodeKey}
                      isBranch={true}
                      {...cell}
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
