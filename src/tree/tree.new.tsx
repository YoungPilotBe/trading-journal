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
  const { treeState, treeGrid } = useTreeManagers();
  const { saveInputField } = useTreeActions();
  const currentState = useTreeStateValue();

  // Get max depth for grid columns
  const maxDepth = useMemo(() => treeGrid.getMaxDepth() + 1, [treeGrid]);

  // Flatten tree to grid
  const gridRows = useMemo(
    () =>
      treeGrid.toGrid(currentState.expandedPaths, currentState.selectedPaths),
    [treeGrid, currentState.expandedPaths, currentState.selectedPaths]
  );

  // Determine cell type
  const getCellType = (
    cell: NonNullable<(typeof gridRows)[0][0]>
  ): CellType => {
    if (cell.isAddButton && cell.templateNodePath) return "addButton";
    if (cell.metadata.inputField && cell.parentPath) return "inputField";
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
          templateNodePath={cell.templateNodePath!}
          label={cell.addButtonLabel || cell.content}
        />
      ),
      inputField: (() => {
        const pathSegments = cell.nodePath.split(".").slice(1); // Remove root segment
        const existingData = treeState.getNestedValue(pathSegments);
        const initialValue = existingData?.value
          ? String(existingData.value)
          : "";

        return (
          <InputField
            config={cell.metadata.inputField!}
            parentPath={cell.parentPath!}
            fieldName={cell.nodePath}
            initialValue={initialValue}
            shouldFocus={currentState.selectedPaths.has(cell.parentPath!)}
            onSave={saveInputField}
          />
        );
      })(),
      timeframe: (
        <TimeframeBadge
          label={cell.content}
          fieldName={cell.nodePath}
          isBranch={!cell.isLeaf}
          {...cell}
          {...cell.metadata}
        />
      ),
      confirmation: (
        <ConfirmationBadge
          label={cell.content}
          fieldName={cell.nodePath}
          isBranch={!cell.isLeaf}
          {...cell}
          {...cell.metadata}
        />
      ),
      leaf: (
        <ToggleBadge
          label={cell.content}
          fieldName={cell.nodePath}
          isBranch={false}
          {...cell}
          {...cell.metadata}
          isDir={
            cell.metadata.isDir ||
            cell.content.includes("_+_") ||
            cell.nodePath.includes("_+_")
          }
        />
      ),
      branch: (
        <ToggleBadge
          label={cell.content}
          fieldName={cell.nodePath}
          isBranch={true}
          {...cell}
          {...cell.metadata}
          isDir={
            cell.metadata.isDir ||
            cell.content.includes("_+_") ||
            cell.nodePath.includes("_+_")
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
