import { conditionalEffectsConfig } from "@/tree/tree.constants";
import { Doc } from "convex/_generated/dataModel";
import React, { createContext, useContext } from "react";

export type EffectType = "positive" | "negative";

type TradeSetupWithTagsAndSnapshotId = Doc<"trade_setups"> & {
  tags?: Record<string, unknown>;
};

interface EffectsContextType {
  tradeSetup: TradeSetupWithTagsAndSnapshotId;
  getFieldEffect: (fieldName: string) => EffectType | undefined;
  selectedTags: Set<string>;
}

const EffectsContext = createContext<EffectsContextType | undefined>(undefined);

interface EffectsProviderProps {
  tradeSetup: TradeSetupWithTagsAndSnapshotId;
  selectedTags?: Set<string>;
  children: React.ReactNode;
}

export const EffectsProvider: React.FC<EffectsProviderProps> = ({
  tradeSetup,
  selectedTags = new Set(),
  children,
}) => {
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

  const contextValue: EffectsContextType = {
    tradeSetup,
    getFieldEffect,
    selectedTags,
  };

  return (
    <EffectsContext.Provider value={contextValue}>
      {children}
    </EffectsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFieldEffect = (fieldName: string): EffectType | undefined => {
  const context = useContext(EffectsContext);

  if (!context) {
    throw new Error("useFieldEffect must be used within an EffectsProvider");
  }

  return context.getFieldEffect(fieldName);
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSelectedTags = (): Set<string> => {
  const context = useContext(EffectsContext);

  if (!context) {
    throw new Error("useSelectedTags must be used within an EffectsProvider");
  }

  return context.selectedTags;
};
