/* eslint-disable react-refresh/only-export-components */
/**
 * TreeContext - Context for managing tree state with class-based TreeNode system
 *
 * This module provides a React Context-based solution for managing dynamic tree structures
 * using the new class-based TreeNode, TreeState, and TreeGrid classes.
 *
 * Key Features:
 * - TreeProvider: Unified provider that manages tree state, selections, and strategy config
 * - Support for type-safe, dynamic strategy generation with custom config
 * - Class-based tree management for better encapsulation
 * - Automatic hydration of dynamic node instances from saved state
 *
 * Usage Pattern 1 - Using strategyFactory with config (Recommended):
 *
 * @example
 * ```tsx
 * import { TreeProvider } from './TreeContext'
 * import { getStrategyFactory } from './strategies'
 * import { IdeaStrategyConfig } from './strategies/idea.constants'
 *
 * function App() {
 *   const config: IdeaStrategyConfig = {
 *     availableTimeframes: ['1m', '5m', '15m'],
 *   }
 *
 *   return (
 *     <TreeProvider
 *       tradeSetup={tradeSetup}
 *       strategyFactory={getStrategyFactory('idea')}
 *       strategyConfig={config}
 *       initialTreeState={savedState} // Dynamic instances auto-hydrate!
 *     >
 *       <Tree />
 *     </TreeProvider>
 *   )
 * }
 * ```
 */

import { Doc } from "convex/_generated/dataModel";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { TreeGrid } from "./TreeGrid.class";
import { TreeNode } from "./TreeNode.class";
import { TreeState, type ITreeState } from "./TreeState.class";
import { conditionalEffectsConfig } from "./tree.constants";
import {
  hydrateDynamicInstances,
  type StrategyFactory,
} from "./tree.utils.new";

export type EffectType = "positive" | "negative";

type TradeSetupWithTagsAndSnapshotId = Doc<"trade_setups"> & {
  tags?: Record<string, unknown>;
};

interface TreeContextType {
  tradeSetup: TradeSetupWithTagsAndSnapshotId;
  getFieldEffect: (fieldName: string) => EffectType | undefined;
  selectedTags: Set<string>;

  // Tree management
  trees: TreeNode[];
  treeState: TreeState;
  treeGrid: TreeGrid;

  // State accessors
  getState: () => ITreeState;

  // Actions
  toggleNode: (
    nodeKey: string,
    isBranch: boolean,
    hasAntiSelection: boolean
  ) => void;
  saveInputField: (data: {
    key: string;
    values: Record<string, unknown>;
  }) => void;
  updateTreeState: (newState: Partial<ITreeState>) => void;
  addDynamicNode: (templateNodeKey: string) => void;
  removeDynamicNode: (instanceKey: string) => void;
}

const TreeContext = createContext<TreeContextType | undefined>(undefined);

interface TreeProviderProps<
  TConfig extends Record<string, unknown> = Record<string, unknown>,
> {
  tradeSetup: TradeSetupWithTagsAndSnapshotId;
  initialTreeState?: ITreeState;
  trees?: TreeNode[];
  strategyFactory?: StrategyFactory<TConfig>;
  strategyConfig?: TConfig;
  onTreeStateChange?: (state: ITreeState) => void;
  children: React.ReactNode;
}

export function TreeProvider<
  TConfig extends Record<string, unknown> = Record<string, unknown>,
>({
  tradeSetup,
  initialTreeState,
  trees: treesProp,
  strategyFactory,
  strategyConfig = {} as TConfig,
  onTreeStateChange,
  children,
}: TreeProviderProps<TConfig>) {
  // Generate trees using factory and config if provided, otherwise use trees prop
  // Then automatically hydrate any dynamic instances from the initialTreeState
  // IMPORTANT: Hydration should only happen ONCE on initial mount
  const [trees] = useState(() => {
    let baseTrees: TreeNode[];

    if (strategyFactory) {
      baseTrees = strategyFactory(strategyConfig);
    } else {
      baseTrees = treesProp || [];
    }

    // If we have an initialTreeState, automatically hydrate dynamic instances
    if (initialTreeState) {
      return hydrateDynamicInstances(baseTrees, initialTreeState);
    }

    return baseTrees;
  });

  // Initialize tree state manager
  const [treeStateManager] = useState(() => {
    return new TreeState(trees, initialTreeState);
  });

  // Initialize tree grid
  const [treeGrid] = useState(() => new TreeGrid(trees));

  // Track state changes for re-rendering
  // stateVersion is used ONLY to trigger re-renders, not in callback deps
  const [stateVersion, setStateVersion] = useState(0);

  // Force component re-render when state changes
  const notifyStateChange = useCallback(() => {
    setStateVersion((v) => v + 1);
    if (onTreeStateChange) {
      onTreeStateChange(treeStateManager.getState());
    }
  }, [treeStateManager, onTreeStateChange]);

  // Compute current state on each render (reactive)
  // This ensures components re-render when stateVersion changes
  // and makes the context value reactive without adding stateVersion to callback deps
  const currentState = useMemo(() => {
    return treeStateManager.getState();
    // stateVersion is intentionally included to force re-computation on state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeStateManager, stateVersion]);

  // Get current state (stable callback for compatibility)
  const getState = useCallback(() => {
    return treeStateManager.getState();
  }, [treeStateManager]);

  // Toggle node handler
  const toggleNode = useCallback(
    (nodeKey: string, isBranch: boolean, hasAntiSelection: boolean) => {
      treeStateManager.toggleNode(nodeKey, isBranch, hasAntiSelection);
      notifyStateChange();
    },
    [treeStateManager, notifyStateChange]
  );

  // Save input field handler
  const saveInputField = useCallback(
    (data: { key: string; values: Record<string, unknown> }) => {
      treeStateManager.saveInputField(data.key, data.values);
      notifyStateChange();
    },
    [treeStateManager, notifyStateChange]
  );

  // Update tree state handler
  const updateTreeState = useCallback(
    (newState: Partial<ITreeState>) => {
      treeStateManager.updateState(newState);
      notifyStateChange();
    },
    [treeStateManager, notifyStateChange]
  );

  // Add dynamic node handler
  const addDynamicNode = useCallback(
    (templateNodeKey: string) => {
      treeStateManager.addDynamicNode(templateNodeKey);
      notifyStateChange();
    },
    [treeStateManager, notifyStateChange]
  );

  // Remove dynamic node handler
  const removeDynamicNode = useCallback(
    (instanceKey: string) => {
      treeStateManager.removeDynamicNode(instanceKey);
      notifyStateChange();
    },
    [treeStateManager, notifyStateChange]
  );

  // Get field effect based on trade direction and selected nodes
  const getFieldEffect = useCallback(
    (fieldName: string): EffectType | undefined => {
      const isLongTrade = tradeSetup.direction === "long";
      const isShortTrade = tradeSetup.direction === "short";

      // Check if this field has conditional effects based on selected tags
      for (const rule of conditionalEffectsConfig) {
        for (const [conditionKey, conditionConfig] of Object.entries(
          rule.conditions
        )) {
          if (currentState.selectedNodes.has(conditionKey)) {
            const conditionalEffect = conditionConfig.childEffects[fieldName];
            if (conditionalEffect !== undefined) {
              return conditionalEffect;
            }
          }
        }
      }

      // Static effects based on trade direction and field type
      const staticEffects: Record<string, EffectType | undefined> = {
        swing_direction_bullish: isLongTrade ? "positive" : "negative",
        swing_direction_bearish: isShortTrade ? "positive" : "negative",
        obim_direction_bullish: isLongTrade ? "positive" : "negative",
        obim_direction_bearish: isShortTrade ? "positive" : "negative",
        fractal_direction_bullish: isLongTrade ? undefined : "positive",
        fractal_direction_bearish: isShortTrade ? undefined : "positive",
        zone_supply: isShortTrade ? "positive" : "negative",
        supply_range: isShortTrade ? "positive" : "negative",
        supply_pivot: isShortTrade ? "positive" : "negative",
        zone_demand: isLongTrade ? "positive" : "negative",
        demand_range: isLongTrade ? "positive" : "negative",
        demand_pivot: isLongTrade ? "positive" : "negative",
        supply_pivot_type_extremum: undefined,
        demand_pivot_type_extremum: undefined,
        supply_pivot_type_decision: "positive",
        demand_pivot_type_decision: "positive",
        obim_pivot_extremum_point: undefined,
        VAH: "positive",
        POC: "positive",
        VAL: "positive",
        wyckoff_accumulation: isLongTrade ? "positive" : "negative",
        wyckoff_distribution: isShortTrade ? "positive" : "negative",
      };

      return staticEffects[fieldName];
    },
    [tradeSetup.direction, currentState]
  );

  const contextValue: TreeContextType = {
    tradeSetup,
    getFieldEffect,
    selectedTags: currentState.selectedNodes,
    trees,
    treeState: treeStateManager,
    treeGrid,
    getState,
    toggleNode,
    saveInputField,
    updateTreeState,
    addDynamicNode,
    removeDynamicNode,
  };

  return (
    <TreeContext.Provider value={contextValue}>{children}</TreeContext.Provider>
  );
}

// ========================================
// Hooks
// ========================================

export const useFieldEffect = (fieldName: string): EffectType | undefined => {
  const context = useContext(TreeContext);

  if (!context) {
    throw new Error("useFieldEffect must be used within a TreeProvider");
  }

  return context.getFieldEffect(fieldName);
};

export const useSelectedTags = (): Set<string> => {
  const context = useContext(TreeContext);

  if (!context) {
    throw new Error("useSelectedTags must be used within a TreeProvider");
  }

  return context.selectedTags;
};

export const useTreeStateValue = (): ITreeState => {
  const context = useContext(TreeContext);

  if (!context) {
    throw new Error("useTreeStateValue must be used within a TreeProvider");
  }

  return context.getState();
};

export const useTreeManagers = () => {
  const context = useContext(TreeContext);

  if (!context) {
    throw new Error("useTreeManagers must be used within a TreeProvider");
  }

  return {
    trees: context.trees,
    treeState: context.treeState,
    treeGrid: context.treeGrid,
  };
};

export const useTreeActions = () => {
  const context = useContext(TreeContext);

  if (!context) {
    throw new Error("useTreeActions must be used within a TreeProvider");
  }

  return {
    toggleNode: context.toggleNode,
    saveInputField: context.saveInputField,
    updateTreeState: context.updateTreeState,
    addDynamicNode: context.addDynamicNode,
    removeDynamicNode: context.removeDynamicNode,
  };
};
