/**
 * Tree Component
 *
 * Renders a dynamic tree structure with support for branches, leaves, and input fields.
 * Supports type-safe configuration injection via TreeProvider.
 *
 * Usage with strategyFactory and config:
 *
 * @example
 * ```tsx
 * import { TreeProvider } from './TreeContext'
 * import { getStrategyFactory } from './strategies'
 * import { Tree } from './tree'
 *
 * function MyComponent() {
 *   const config = {
 *     availableTimeframes: ['1m', '5m', '15m'],
 *   }
 *
 *   return (
 *     <TreeProvider
 *       tradeSetup={tradeSetup}
 *       strategyFactory={getStrategyFactory('idea')}
 *       strategyConfig={config}
 *     >
 *       <Tree />
 *     </TreeProvider>
 *   )
 * }
 * ```
 *
 * Alternative usage with pre-generated strategy:
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const strategy = createIdeaStrategyTree({ availableTimeframes: ['1m'] })
 *
 *   return (
 *     <TreeProvider tradeSetup={tradeSetup} strategy={strategy}>
 *       <Tree />
 *     </TreeProvider>
 *   )
 * }
 * ```
 */
import { useMemo } from "react";
import { InputField } from "./InputField";
import { ToggleBadge } from "./ToggleBadge";
import { useTreeActions, useTreeState, useTreeToggle } from "./TreeContext";
import {
  findNodePathArray,
  flattenTreeArrayToGrid,
  getNestedValue,
  getTreeDepthArray,
} from "./tree.utils";

interface Props extends React.InputHTMLAttributes<HTMLDivElement> {
  viewOnly?: boolean;
}

const Tree = ({ viewOnly = false, ...divProps }: Props) => {
  // Get tree state and actions from context
  const treeState = useTreeState();
  const { saveInputField } = useTreeActions();

  // Get strategy from context (via useTreeToggle)
  const { strategy } = useTreeToggle();

  const treeDepth = useMemo(() => getTreeDepthArray(strategy), [strategy]);
  const gridRows = useMemo(
    () =>
      flattenTreeArrayToGrid(
        strategy,
        treeState.expandedKeys,
        treeState.selectedNodes
      ),
    [strategy, treeState.expandedKeys, treeState.selectedNodes]
  );

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
                          treeState.tags,
                          nodePath
                        );
                        return existingData?.value
                          ? String(existingData.value)
                          : "";
                      })()}
                      shouldFocus={treeState.selectedNodes.has(cell.parentKey)}
                      onSave={saveInputField}
                      readOnly={viewOnly}
                    />
                  ) : cell.isLeaf ? (
                    <ToggleBadge
                      label={cell.content}
                      fieldName={cell.nodeKey}
                      icon={cell.icon}
                      iconClassName={cell.iconClassName}
                      isDir={cell.isDir}
                      isBranch={false}
                      readOnly={viewOnly}
                    />
                  ) : (
                    <ToggleBadge
                      label={cell.content}
                      fieldName={cell.nodeKey}
                      icon={cell.icon}
                      iconClassName={cell.iconClassName}
                      isDir={cell.isDir}
                      isBranch={true}
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
