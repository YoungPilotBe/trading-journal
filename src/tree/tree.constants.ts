// Re-export all node definitions and utilities
export * from "./nodes";
export * from "./utils";

// Base icon className for all tree icons
export const TREE_ICON_BASE_CLASS = "w-3 h-3 flex-shrink-0";

// Configuration for conditional effects based on parent selections
export interface ConditionalEffectRule {
  // The parent field that affects children
  parentField: string;
  // Map of parent values to child effect rules
  conditions: Record<
    string,
    {
      // Map of child field names to their effects when this parent is selected
      childEffects: Record<string, "positive" | "negative" | undefined>;
    }
  >;
}

// Configuration for conditional effects
export const conditionalEffectsConfig: ConditionalEffectRule[] = [
  {
    parentField: "swing",
    conditions: {
      bullish: { childEffects: {} },
      bearish: { childEffects: {} },
    },
  },
  {
    parentField: "fractal",
    conditions: {
      bullish: { childEffects: {} },
      bearish: { childEffects: {} },
    },
  },
  {
    parentField: "demand",
    conditions: {
      range: {
        childEffects: {
          extension_fvg: "positive",
          extension_25_percent: "positive",
          liquidity_fueled: "positive",
          liquidity_wicked: "negative",
        },
      },
    },
  },
  {
    parentField: "supply",
    conditions: {
      range: {
        childEffects: {
          extension_fvg: "negative",
          extension_25_percent: "negative",
          liquidity_fueled: "negative",
          liquidity_wicked: "positive",
        },
      },
    },
  },
];
