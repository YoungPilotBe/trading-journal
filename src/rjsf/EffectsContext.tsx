import { Doc } from "convex/_generated/dataModel";
import React, { createContext, useContext } from "react";

export type EffectType = "positive" | "negative";

type TradeSetupWithTagsAndSnapshotId = Doc<"trade_setups"> & {
  tags?: Record<string, unknown>;
};

interface EffectsContextType {
  tradeSetup: TradeSetupWithTagsAndSnapshotId;
  getFieldEffect: (
    fieldName: string,
    fieldValue: string
  ) => EffectType | undefined;
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
  const getFieldEffect = (
    fieldName: string,
    fieldValue: string
  ): EffectType | undefined => {
    const isLongTrade = tradeSetup.direction === "long";
    const isShortTrade = tradeSetup.direction === "short";

    switch (fieldName) {
      // Direction fields - effect depends on the actual value selected
      case "swing_direction":
      case "obim_direction":
        if (fieldValue === "bullish") {
          return isLongTrade ? "positive" : "negative";
        } else if (fieldValue === "bearish") {
          return isShortTrade ? "positive" : "negative";
        }
        break;
      case "fractal_direction":
        if (fieldValue === "bullish") {
          return isLongTrade ? undefined : "positive";
        } else if (fieldValue === "bearish") {
          return isShortTrade ? undefined : "positive";
        }
        break;

      // Strength fields - effect depends on the actual value
      case "swing_strength":
        if (fieldValue === "strong") {
          return "positive";
        } else if (fieldValue === "weakening") {
          return "negative";
        }
        break;
      case "fractal_strength":
        if (fieldValue === "strong") {
          return "negative";
        } else if (fieldValue === "weakening") {
          return "positive";
        }
        break;

      // Supply zones are positive for short trades, negative for long trades
      case "supply":
      case "supply_pivot":
        return isShortTrade ? "positive" : "negative";

      // Demand zones are positive for long trades, negative for short trades
      case "demand":
      case "demand_pivot":
        return isLongTrade ? "positive" : "negative";

      // Point type indicators
      case "supply_pivot_extremum_point":
      case "demand_pivot_extremum_point":
      case "obim_pivot_extremum_point":
        if (fieldValue === "extremum_point") {
          return undefined;
        } else if (fieldValue === "decision_point") {
          return "positive";
        }
        break;

      // Range-related fields (generally positive)
      case "POC":
        return "positive";

      // General positive indicators (regardless of direction and value)
      case "obim_caused_wick_bos":
        return "negative";
      case "obim_grabbed_liquidity":
      case "obim_tooth_liquidity":
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

export const useFieldEffect = (
  fieldName: string,
  fieldValue?: string
): EffectType | undefined => {
  const context = useContext(EffectsContext);

  if (!context) {
    throw new Error("useFieldEffect must be used within an EffectsProvider");
  }

  if (!fieldValue) {
    return undefined;
  }

  return context.getFieldEffect(fieldName, fieldValue);
};
