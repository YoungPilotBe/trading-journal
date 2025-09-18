import { capitalize } from "lodash";
import type { TreeNode } from "./tree.utils";

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
    parentField: "swing_direction",
    conditions: {
      swing_direction_bullish: {
        childEffects: {
          swing_strength_strong: "positive",
          swing_strength_weakening: "negative",
        },
      },
      swing_direction_bearish: {
        childEffects: {
          swing_strength_strong: "negative",
          swing_strength_weakening: "positive",
        },
      },
    },
  },
  {
    parentField: "fractal_direction",
    conditions: {
      fractal_direction_bullish: {
        childEffects: {
          fractal_strength_strong: "positive",
          fractal_strength_weakening: "negative",
        },
      },
      fractal_direction_bearish: {
        childEffects: {
          fractal_strength_strong: "negative",
          fractal_strength_weakening: "positive",
        },
      },
    },
  },
  {
    parentField: "obim_direction",
    conditions: {
      obim_direction_bullish: {
        childEffects: {
          obim_extension_fvg: "positive",
          "obim_extension_25%": "positive",
          obim_grabbed_liquidity: "positive",
          obim_caused_wick_bos: "negative",
          obim_staircased: "positive",
        },
      },
      obim_direction_bearish: {
        childEffects: {
          obim_extension_fvg: "negative",
          "obim_extension_25%": "negative",
          obim_grabbed_liquidity: "negative",
          obim_caused_wick_bos: "positive",
          obim_staircased: "negative",
        },
      },
    },
  },
  {
    parentField: "wyckoff",
    conditions: {
      wyckoff_accumulation: {
        childEffects: {
          "wyckoff_model_model 1": "positive",
          "wyckoff_model_model 2": "positive",
        },
      },
      wyckoff_distribution: {
        childEffects: {
          "wyckoff_model_model 1": "negative",
          "wyckoff_model_model 2": "negative",
        },
      },
    },
  },
];

const createContradictingBranch = (
  prefix: string,
  contras: [string, string],
  children?: TreeNode[]
): NonNullable<TreeNode["children"]> => {
  return [
    {
      key: `${prefix}_${contras[0]}`,
      title: `${capitalize(contras[0])}`,
      anti: [`${prefix}_${contras[1]}`],
      children,
    },
    {
      key: `${prefix}_${contras[1]}`,
      title: `${capitalize(contras[1])}`,
      anti: [`${prefix}_${contras[0]}`],
      children,
    },
  ];
};

const createOBIMChildren = () => [
  {
    key: "obim_extension",
    title: "Extension",
    children: [
      {
        key: "obim_extension_fvg",
        title: "FVG",
      },
      {
        key: "obim_extension_25%",
        title: "25%",
      },
    ],
  },

  {
    key: "obim_pivot",
    title: "Pivot",
    children: [
      {
        key: "obim_pivot_extremum_point",
        title: "Pivot Point",
      },
    ],
  },
  {
    key: "obim_liquidity",
    title: "Liquidity",
    children: [
      {
        key: "obim_grabbed_liquidity",
        title: "Grabbed Liquidity",
      },
      {
        key: "obim_caused_wick_bos",
        title: "Caused Wick BOS",
      },
    ],
  },

  {
    key: "obim_staircased",
    title: "Staircased",
  },
];

export const strategyTree: TreeNode = {
  key: "strategy",
  title: "Strategy",
  children: [
    {
      key: "market_structure",
      title: "MS",
      children: [
        {
          key: "swing",
          title: "Swing",
          children: [
            ...createContradictingBranch(
              "swing_direction",
              ["bullish", "bearish"],
              createContradictingBranch("swing_strength", [
                "strong",
                "weakening",
              ])
            ),
          ],
        },
        {
          key: "fractal",
          title: "Fractal",
          children: [
            ...createContradictingBranch(
              "fractal_direction",
              ["bullish", "bearish"],
              createContradictingBranch("fractal_strength", [
                "strong",
                "weakening",
              ])
            ),
          ],
        },
      ],
    },
    {
      key: "zone",
      title: "Zone",
      children: [
        {
          key: "zone_supply",
          anti: ["zone_demand"],
          title: "Supply",
          children: [
            {
              key: "supply_range",
              title: "Range",
              anti: ["supply_pivot"],
            },
            {
              key: "supply_pivot",
              title: "Pivot",
              anti: ["supply_range"],
              children: [
                {
                  key: "supply_pivot_type_extremum",
                  title: "Extremum",
                  anti: ["supply_pivot_type_decision"],
                },
                {
                  key: "supply_pivot_type_decision",
                  title: "Decision",
                  anti: ["supply_pivot_type_extremum"],
                },
              ],
            },
          ],
        },
        {
          key: "zone_demand",
          anti: ["zone_supply"],
          title: "Demand",
          children: [
            {
              key: "demand_range",
              title: "Range",
              anti: ["demand_pivot"],
            },
            {
              key: "demand_pivot",
              title: "Pivot",
              anti: ["demand_range"],
              children: [
                {
                  key: "demand_pivot_type_extremum",
                  title: "Extremum",
                  anti: ["demand_pivot_type_decision"],
                },
                {
                  key: "demand_pivot_type_decision",
                  title: "Decision",
                  anti: ["demand_pivot_type_extremum"],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: "obim",
      title: "OBIM",
      children: [
        ...createContradictingBranch(
          "obim_direction",
          ["bullish", "bearish"],
          createOBIMChildren()
        ),
      ],
    },
    {
      key: "range",
      title: "Range",
      children: [
        {
          key: "VAH",
          title: "VAH",
        },
        {
          key: "POC",
          title: "POC",
        },
        {
          key: "VAL",
          title: "VAL",
        },
      ],
    },
    {
      key: "wyckoff",
      title: "Wyckoff",
      children: [
        ...createContradictingBranch(
          "wyckoff",
          ["accumulation", "distribution"],
          createContradictingBranch("wyckoff_model", ["model 1", "model 2"])
        ),
      ],
    },
  ],
};
