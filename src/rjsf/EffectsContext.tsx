import { Doc } from "convex/_generated/dataModel";
import React, { createContext, useContext } from "react";

export type EffectType = "positive" | "negative";

type TradeSetupWithTagsAndSnapshotId = Doc<"trade_setups"> & {
  tags?: Record<string, unknown>;
};

interface EffectsContextType {
  tradeSetup: TradeSetupWithTagsAndSnapshotId;
  getFieldEffect: (fieldName: string) => EffectType | undefined;
}

const EffectsContext = createContext<EffectsContextType | undefined>(undefined);

interface EffectsProviderProps {
  tradeSetup: TradeSetupWithTagsAndSnapshotId;
  children: React.ReactNode;
}

export const EffectsProvider: React.FC<EffectsProviderProps> = ({
  tradeSetup,
  children,
}) => {
  const getFieldEffect = (fieldName: string): EffectType | undefined => {
    const isLongTrade = tradeSetup.direction === "long";
    const isShortTrade = tradeSetup.direction === "short";

    switch (fieldName) {
      // Direction fields - effect depends on the actual value selected
      case "swing_direction_bullish":
      case "swing_direction_bearish":
      case "obim_direction_bullish":
      case "obim_direction_bearish":
        if (fieldName.includes("bullish")) {
          return isLongTrade ? "positive" : "negative";
        } else if (fieldName.includes("bearish")) {
          return isShortTrade ? "positive" : "negative";
        }
        break;
      case "fractal_direction_bullish":
      case "fractal_direction_bearish":
        if (fieldName.includes("bullish")) {
          return isLongTrade ? undefined : "positive";
        } else if (fieldName.includes("bearish")) {
          return isShortTrade ? undefined : "positive";
        }
        break;

      // Strength fields - effect depends on the actual value
      case "swing_strength_strong":
        return "positive";
      case "swing_strength_weakening":
        return "negative";
      case "fractal_strength_strong":
        return "negative";
      case "fractal_strength_weakening":
        return "positive";

      // Supply zones are positive for short trades, negative for long trades
      case "zone_supply":
      case "supply_range":
      case "supply_pivot":
        return isShortTrade ? "positive" : "negative";

      // Demand zones are positive for long trades, negative for short trades
      case "zone_demand":
      case "demand_range":
      case "demand_pivot":
        return isLongTrade ? "positive" : "negative";

      // Point type indicators
      case "supply_pivot_extremum":
      case "demand_pivot_extremum":
        return undefined;
      case "supply_pivot_decision":
      case "demand_pivot_decision":
        return "positive";
      case "obim_pivot_extremum_point":
        return undefined;

      // OBIM Extension fields
      case "obim_extension_fvg":
      case "obim_extension_25%":
        return "positive";

      // OBIM Liquidity fields
      case "obim_grabbed_liquidity":
        return "positive";
      case "obim_caused_wick_bos":
        return "negative";

      // OBIM Staircased
      case "obim_staircased":
        return "positive";

      // Range-related fields (generally positive)
      case "VAH":
      case "POC":
      case "VAL":
        return "positive";

      // Wyckoff fields
      case "wyckoff_accumulation":
        return isLongTrade ? "positive" : "negative";
      case "wyckoff_distribution":
        return isShortTrade ? "positive" : "negative";
      case "wyckoff_model_model 1":
      case "wyckoff_model_model 2":
        return "positive";

      default:
        // For unknown fields, default to positive if they have a truthy value
        return undefined;
    }

    return undefined;
  };

  const contextValue: EffectsContextType = {
    tradeSetup,
    getFieldEffect,
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
