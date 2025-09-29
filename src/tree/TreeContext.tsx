import { conditionalEffectsConfig, strategyTree } from "@/tree/tree.constants";
import type { TreeNode } from "@/tree/tree.utils";
import {
  convertSelectionToJsonArray,
  findNodePathArray,
  setNestedValue,
  toggleNodeArray,
} from "@/tree/tree.utils";
import { Doc } from "convex/_generated/dataModel";
import React, { createContext, useCallback, useContext, useState } from "react";

export type EffectType = "positive" | "negative";

type TradeSetupWithTagsAndSnapshotId = Doc<"trade_setups"> & {
  tags?: Record<string, unknown>;
};

// Tree state interface
export interface TreeState {
  expandedKeys: Set<string>; // Which branch nodes are expanded
  selectedNodes: Set<string>; // Which leaf nodes are selected
  tags: Record<string, unknown>; // JSON representation of selected tags
}

interface TreeContextType {
  tradeSetup: TradeSetupWithTagsAndSnapshotId;
  getFieldEffect: (fieldName: string) => EffectType | undefined;
  selectedTags: Set<string>;
  // Tree state management
  treeState: TreeState;
  strategy: TreeNode[];
  toggleNode: (
    nodeKey: string,
    isBranch: boolean,
    hasAntiSelection: boolean
  ) => void;
  saveInputField: (data: {
    key: string;
    values: Record<string, unknown>;
  }) => void;
  updateTreeState: (newState: Partial<TreeState>) => void;
}

const TreeContext = createContext<TreeContextType | undefined>(undefined);

interface TreeProviderProps {
  tradeSetup: TradeSetupWithTagsAndSnapshotId;
  selectedTags?: Set<string>;
  initialTreeState?: TreeState;
  strategy?: TreeNode[];
  onTreeStateChange?: (state: TreeState) => void;
  children: React.ReactNode;
}

export const TreeProvider: React.FC<TreeProviderProps> = ({
  tradeSetup,
  selectedTags = new Set(),
  initialTreeState,
  strategy = strategyTree,
  onTreeStateChange,
  children,
}) => {
  // Initialize tree state
  const [treeState, setTreeState] = useState<TreeState>(() => {
    if (initialTreeState) {
      return initialTreeState;
    }
    return {
      expandedKeys: new Set<string>(),
      selectedNodes: new Set<string>(),
      tags: {},
    };
  });

  // Update tree state and notify parent
  const updateTreeState = useCallback(
    (newState: Partial<TreeState>) => {
      const updatedState = { ...treeState, ...newState };
      setTreeState(updatedState);
      if (onTreeStateChange) {
        onTreeStateChange(updatedState);
      }
    },
    [treeState, onTreeStateChange]
  );

  // Toggle node handler
  const toggleNode = useCallback(
    (nodeKey: string, isBranch: boolean, hasAntiSelection: boolean) => {
      const result = toggleNodeArray(
        strategy,
        treeState.selectedNodes,
        treeState.expandedKeys,
        nodeKey,
        isBranch,
        hasAntiSelection
      );

      const updatedState: TreeState = {
        expandedKeys: result.expandedKeys,
        selectedNodes: result.selectedNodes,
        tags: convertSelectionToJsonArray(strategy, result.selectedNodes),
      };

      setTreeState(updatedState);
      if (onTreeStateChange) {
        onTreeStateChange(updatedState);
      }
    },
    [
      strategy,
      treeState.selectedNodes,
      treeState.expandedKeys,
      onTreeStateChange,
    ]
  );

  // Save input field handler
  const saveInputField = useCallback(
    (data: { key: string; values: Record<string, unknown> }) => {
      const newTags = { ...treeState.tags };
      const nodePath = findNodePathArray(strategy, data.key);
      setNestedValue(newTags, nodePath, data.values, true);

      const updatedState: TreeState = {
        ...treeState,
        tags: newTags,
      };

      setTreeState(updatedState);
      if (onTreeStateChange) {
        onTreeStateChange(updatedState);
      }
    },
    [treeState, strategy, onTreeStateChange]
  );
  const getFieldEffect = (fieldName: string): EffectType | undefined => {
    const isLongTrade = tradeSetup.direction === "long";
    const isShortTrade = tradeSetup.direction === "short";

    // Check if this field has conditional effects based on selected tags
    for (const rule of conditionalEffectsConfig) {
      // Find if any of the parent conditions are selected
      for (const [conditionKey, conditionConfig] of Object.entries(
        rule.conditions
      )) {
        if (selectedTags.has(conditionKey)) {
          // Check if this field is affected by this condition
          const conditionalEffect = conditionConfig.childEffects[fieldName];
          if (conditionalEffect !== undefined) {
            return conditionalEffect;
          }
        }
      }
    }

    // Static effects based on trade direction and field type
    const staticEffects: Record<string, EffectType | undefined> = {
      // Direction fields - effect depends on the actual value selected
      swing_direction_bullish: isLongTrade ? "positive" : "negative",
      swing_direction_bearish: isShortTrade ? "positive" : "negative",
      obim_direction_bullish: isLongTrade ? "positive" : "negative",
      obim_direction_bearish: isShortTrade ? "positive" : "negative",
      fractal_direction_bullish: isLongTrade ? undefined : "positive",
      fractal_direction_bearish: isShortTrade ? undefined : "positive",

      // Supply zones are positive for short trades, negative for long trades
      zone_supply: isShortTrade ? "positive" : "negative",
      supply_range: isShortTrade ? "positive" : "negative",
      supply_pivot: isShortTrade ? "positive" : "negative",

      // Demand zones are positive for long trades, negative for short trades
      zone_demand: isLongTrade ? "positive" : "negative",
      demand_range: isLongTrade ? "positive" : "negative",
      demand_pivot: isLongTrade ? "positive" : "negative",

      // Point type indicators
      supply_pivot_type_extremum: undefined,
      demand_pivot_type_extremum: undefined,
      supply_pivot_type_decision: "positive",
      demand_pivot_type_decision: "positive",
      obim_pivot_extremum_point: undefined,

      // Range-related fields (generally positive)
      VAH: "positive",
      POC: "positive",
      VAL: "positive",

      // Wyckoff fields
      wyckoff_accumulation: isLongTrade ? "positive" : "negative",
      wyckoff_distribution: isShortTrade ? "positive" : "negative",
    };

    // Return static effect if defined
    const staticEffect = staticEffects[fieldName];
    if (staticEffect !== undefined) {
      return staticEffect;
    }

    // For fields not in static effects, return undefined
    return undefined;
  };

  const contextValue: TreeContextType = {
    tradeSetup,
    getFieldEffect,
    selectedTags,
    treeState,
    strategy,
    toggleNode,
    saveInputField,
    updateTreeState,
  };

  return (
    <TreeContext.Provider value={contextValue}>{children}</TreeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFieldEffect = (fieldName: string): EffectType | undefined => {
  const context = useContext(TreeContext);

  if (!context) {
    throw new Error("useFieldEffect must be used within a TreeProvider");
  }

  return context.getFieldEffect(fieldName);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSelectedTags = (): Set<string> => {
  const context = useContext(TreeContext);

  if (!context) {
    throw new Error("useSelectedTags must be used within a TreeProvider");
  }

  return context.selectedTags;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTreeState = (): TreeState => {
  const context = useContext(TreeContext);

  if (!context) {
    throw new Error("useTreeState must be used within a TreeProvider");
  }

  return context.treeState;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTreeToggle = () => {
  const context = useContext(TreeContext);

  if (!context) {
    throw new Error("useTreeToggle must be used within a TreeProvider");
  }

  return {
    toggleNode: context.toggleNode,
    strategy: context.strategy,
    treeState: context.treeState,
  };
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTreeActions = () => {
  const context = useContext(TreeContext);

  if (!context) {
    throw new Error("useTreeActions must be used within a TreeProvider");
  }

  return {
    toggleNode: context.toggleNode,
    saveInputField: context.saveInputField,
    updateTreeState: context.updateTreeState,
  };
};
