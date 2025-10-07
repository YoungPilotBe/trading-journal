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
import { AddNodeButton } from "./components/AddNodeButton";
import { ConfirmationBadge } from "./components/ConfirmationBadge";
import { InputField } from "./components/InputField";
import { TimeframeBadge } from "./components/TimeframeBadge";
import { ToggleBadge } from "./components/ToggleBadge";
import { findNodePathArray } from "./tree.utils.new";
import {
  useTreeActions,
  useTreeManagers,
  useTreeStateValue,
} from "./TreeContext.new";

interface Props extends React.InputHTMLAttributes<HTMLDivElement> {}

type CellType =
  | "addButton"
  | "inputField"
  | "timeframe"
  | "confirmation"
  | "leaf"
  | "branch";

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

  // Determine cell type
  const getCellType = (
    cell: NonNullable<(typeof gridRows)[0][0]>
  ): CellType => {
    if (cell.isAddButton && cell.templateNodeKey) return "addButton";
    if (cell.metadata.inputField && cell.parentKey) return "inputField";
    if (cell.metadata.isTimeframe) return "timeframe";
    if (cell.metadata.isConfirmation) return "confirmation";
    if (cell.isLeaf) return "leaf";
    return "branch";
  };

  // Render cell based on type
  const renderCell = (cell: NonNullable<(typeof gridRows)[0][0]>) => {
    const cellType = getCellType(cell);

    const componentMap: Record<CellType, JSX.Element> = {
      addButton: (
        <AddNodeButton
          templateNodeKey={cell.templateNodeKey!}
          label={cell.addButtonLabel || cell.content}
        />
      ),
      inputField: (() => {
        const nodePath = findNodePathArray(trees, cell.parentKey!);
        const existingData = treeState.getNestedValue(nodePath);
        const initialValue = existingData?.value
          ? String(existingData.value)
          : "";

        return (
          <InputField
            config={cell.metadata.inputField!}
            parentKey={cell.parentKey!}
            fieldName={cell.nodeKey.replace("_input", "")}
            initialValue={initialValue}
            shouldFocus={currentState.selectedNodes.has(cell.parentKey!)}
            onSave={saveInputField}
          />
        );
      })(),
      timeframe: (
        <TimeframeBadge
          label={cell.content}
          fieldName={cell.nodeKey}
          isBranch={!cell.isLeaf}
          {...cell}
          {...cell.metadata}
        />
      ),
      confirmation: (
        <ConfirmationBadge
          label={cell.content}
          fieldName={cell.nodeKey}
          isBranch={!cell.isLeaf}
          {...cell}
          {...cell.metadata}
        />
      ),
      leaf: (
        <ToggleBadge
          label={cell.content}
          fieldName={cell.nodeKey}
          isBranch={false}
          {...cell}
          {...cell.metadata}
          isDir={
            cell.metadata.isDir ||
            cell.content.includes("_+_") ||
            cell.nodeKey.includes("_+_")
          }
        />
      ),
      branch: (
        <ToggleBadge
          label={cell.content}
          fieldName={cell.nodeKey}
          isBranch={true}
          {...cell}
          {...cell.metadata}
          isDir={
            cell.metadata.isDir ||
            cell.content.includes("_+_") ||
            cell.nodeKey.includes("_+_")
          }
        />
      ),
    };

    return componentMap[cellType];
  };

  return (
    <div {...divProps}>
      {gridRows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${maxDepth}, minmax(120px, 150px))`,
          }}
        >
          {row.map((cell, colIndex) => (
            <div key={colIndex} className="flex items-stretch w-full py-0.5">
              {cell && renderCell(cell)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Tree;
