import { capitalize } from "lodash";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Droplets,
  GitBranch,
  LogIn,
  LogOut,
  Mountain,
  Settings,
  Shield,
  Spline,
  Square,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { z } from "zod";
import type { TreeNode } from "./tree.utils";

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
      swing_bullish: {
        childEffects: {
          // Market structure bullish effects can be defined here
        },
      },
      swing_bearish: {
        childEffects: {
          // Market structure bearish effects can be defined here
        },
      },
    },
  },
  {
    parentField: "fractal",
    conditions: {
      fractal_bullish: {
        childEffects: {
          // Fractal bullish effects can be defined here
        },
      },
      fractal_bearish: {
        childEffects: {
          // Fractal bearish effects can be defined here
        },
      },
    },
  },
  {
    parentField: "demand",
    conditions: {
      demand: {
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
      supply: {
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

export const createContradictingBranch = (
  prefix: string,
  contras: (string | [string, TreeNode[]] | TreeNode)[]
): NonNullable<TreeNode["children"]> => {
  // Extract just the keys for anti-array generation
  const contraKeys = contras.map((contra) => {
    if (typeof contra === "string") return contra;
    if (Array.isArray(contra)) return contra[0];
    // For TreeNode objects, extract the key by removing the prefix
    return contra.key.replace(`${prefix}_`, "");
  });

  return contras.map((contra, index) => {
    // If it's already a complete TreeNode, use it but ensure anti array is set
    if (typeof contra === "object" && !Array.isArray(contra)) {
      return {
        ...contra,
        anti: contraKeys
          .filter((_, i) => i !== index)
          .map((otherKey) => `${prefix}_${otherKey}`),
      };
    }

    // Handle string or [string, TreeNode[]] tuple
    const [key, children] =
      typeof contra === "string" ? [contra, undefined] : contra;

    return {
      key: `${prefix}_${key}`,
      title: `${capitalize(key)}`,
      anti: contraKeys
        .filter((_, i) => i !== index)
        .map((otherKey) => `${prefix}_${otherKey}`),
      children,
    };
  });
};

// Helper function to create Fixed Range Confluence children
export const createFixedRangeConfluenceChildren = (prefix: string) => [
  {
    key: `${prefix}_vah`,
    title: "VAH",
  },
  {
    key: `${prefix}_poc`,
    title: "POC",
  },
  {
    key: `${prefix}_val`,
    title: "VAL",
  },
];

export const createDiscountPremiumPricing = (prefix: string) =>
  createContradictingBranch(prefix, [
    {
      key: `${prefix}_extreme_premium`,
      title: "Extreme Premium",
      icon: ChevronsUp,
      iconClassName: "",
    },
    {
      key: `${prefix}_premium`,
      title: "Premium",
      icon: ChevronUp,
      iconClassName: "",
    },
    {
      key: `${prefix}_discount`,
      title: "Discount",
      icon: ChevronDown,
      iconClassName: "",
    },
    {
      key: `${prefix}_extreme_discount`,
      title: "Extreme Discount",
      icon: ChevronsDown,
      iconClassName: "",
    },
  ]);
// Helper function to create liquidity children
export const createLiquidityChildren = (prefix: string) => [
  {
    key: `${prefix}_liquidity_fueled`,
    title: "Fueled",
  },
  {
    key: `${prefix}_liquidity_wicked`,
    title: "Wicked",
  },
];

// Helper function to create OBIM children for Supply/Demand
export const createSupplyDemandOBIMChildren = (prefix: string) => [
  {
    key: `${prefix}_obim_extension`,
    title: "Extension",
    children: [
      {
        key: `${prefix}_obim_extension_fvg`,
        title: "FVG",
      },
      {
        key: `${prefix}_obim_extension_25_percent`,
        title: "25%",
      },
    ],
  },
  {
    key: `${prefix}_obim_inducement`,
    title: "Inducement",
  },
  {
    key: `${prefix}_obim_pivot`,
    title: "Pivot",
    children: [
      {
        key: `${prefix}_obim_pivot_ep`,
        title: "EP",
      },
      {
        key: `${prefix}_obim_pivot_dp`,
        title: "DP",
      },
    ],
  },
  {
    key: `${prefix}_obim_fixed_range_confluence`,
    title: "Fixed Range Confluence",
    children: createFixedRangeConfluenceChildren(
      `${prefix}_obim_fixed_range_confluence`
    ),
  },
  {
    key: `${prefix}_obim_liquidity`,
    title: "Liquidity",
    children: createLiquidityChildren(`${prefix}_obim`),
  },
];

// Helper function to create Range children for Demand
export const createDemandRangeChildren = (prefix: string) =>
  [
    {
      key: `${prefix}_range_inducement`,
      title: "Inducement",
    },
    {
      key: `${prefix}_range_s2b`,
      title: "S2B",
    },
    {
      key: `${prefix}_range_chain`,
      title: "Chain",
      inputField: customDrives(),
    },
    {
      key: `${prefix}_range_fixed_range_confluence`,
      title: "Fixed Range Confluence",
      children: createFixedRangeConfluenceChildren(
        `${prefix}_range_fixed_range_confluence`
      ),
    },
  ] satisfies TreeNode[];

// Helper function to create Range children for Supply
export const createSupplyRangeChildren = (prefix: string) => [
  {
    key: `${prefix}_range_inducement`,
    title: "Inducement",
  },
  {
    key: `${prefix}_range_b2s`,
    title: "B2S",
  },
  {
    key: `${prefix}_range_chain`,
    title: "Chain",
    inputField: customDrives(),
  },
  {
    key: `${prefix}_range_fixed_range_confluence`,
    title: "Fixed Range Confluence",
    children: createFixedRangeConfluenceChildren(
      `${prefix}_range_fixed_range_confluence`
    ),
  },
];

export const customPrice = () => {
  return {
    schema: z.coerce.number().positive("Price must be positive"),
    placeholder: "Enter price...",
    custom: [
      {
        key: "price",
        transform: (rawValue: unknown) => rawValue,
      },
    ],
  };
};

export const customDrives = () => {
  return {
    schema: z.coerce
      .number()
      .int("Drives must be a whole number")
      .positive("Drives must be positive"),
    placeholder: "Enter # drives",
    custom: [
      {
        key: "drives",
        transform: (rawValue: unknown) => rawValue,
      },
    ],
  };
};

export const strategyTree: TreeNode[] = [
  {
    key: "market_structure",
    title: "MS",
    icon: BarChart3,
    iconClassName: "",
    children: [
      {
        key: "swing",
        title: "Swing",
        icon: Activity,
        iconClassName: "",
        children: createContradictingBranch("swing", [
          "bullish",
          "bearish",
          "range",
        ]),
      },
      {
        key: "fractal",
        title: "Fractal",
        icon: GitBranch,
        iconClassName: "",
        children: createContradictingBranch("fractal", [
          "bullish",
          "bearish",
          "range",
        ]),
      },
      {
        key: "optional_settings",
        title: "_+_",
        icon: Settings,
        iconClassName: "",
        isDir: true,
        children: [
          {
            key: "protected_levels",
            title: "Protected",
            icon: Shield,
            iconClassName: "",
            children: [
              {
                key: "protected_high",
                anti: ["protected_low"],
                title: "High",
                icon: ArrowUp,
                iconClassName: "",
                inputField: customPrice(),
              },
              {
                key: "protected_low",
                anti: ["protected_high"],
                title: "Low",
                icon: ArrowDown,
                iconClassName: "",
                inputField: customPrice(),
              },
            ],
          },
          {
            key: "weak_levels",
            title: "Weak",
            icon: AlertTriangle,
            iconClassName: "",
            children: [
              {
                key: "weak_high",
                anti: ["weak_low"],
                title: "High",
                icon: ArrowUp,
                iconClassName: "",
                inputField: customPrice(),
              },
              {
                key: "weak_low",
                anti: ["weak_high"],
                title: "Low",
                icon: ArrowDown,
                iconClassName: "",
                inputField: customPrice(),
              },
            ],
          },
          {
            key: "market_structure_liquidity",
            title: "Liquidity",
            icon: Droplets,
            iconClassName: "",
            children: [
              {
                key: "wicking_tops",
                title: "Wicking Tops",
                icon: Mountain,
                iconClassName: "scale-x-[-1]",
              },
              {
                key: "wicking_bottoms",
                title: "Wicking Bottoms",
                icon: Mountain,
                iconClassName: "rotate-180",
              },
              {
                key: "liquidity_curve",
                title: "Curve",
                iconClassName: "",
                children: [
                  {
                    key: "liquidity_curve_up",
                    title: "Up",
                    icon: Spline,
                    iconClassName: "rotate-180 text-emerald-500",
                    anti: ["liquidity_curve_down"],
                  },
                  {
                    key: "liquidity_curve_down",
                    title: "Down",
                    icon: Spline,
                    iconClassName: "rotate-90 text-rose-500",
                    anti: ["liquidity_curve_up"],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "entry",
    title: "Entry",
    icon: LogIn,
    iconClassName: "",
    children: [
      {
        key: "entry_demand",
        title: "Demand",
        icon: TrendingUp,
        iconClassName: "text-emerald-500",
        anti: ["entry_supply"],
        children: [
          {
            key: "entry_demand_range",
            title: "Range",
            icon: Square,
            iconClassName: "",
            children: createDemandRangeChildren("entry_demand"),
          },
          {
            key: "entry_demand_obim",
            title: "OBIM",
            icon: Target,
            iconClassName: "",
            children: createSupplyDemandOBIMChildren("entry_demand"),
          },
        ],
      },
      {
        key: "entry_supply",
        title: "Supply",
        icon: TrendingDown,
        iconClassName: "text-rose-500",
        anti: ["entry_demand"],
        children: [
          {
            key: "entry_supply_range",
            title: "Range",
            icon: Square,
            iconClassName: "",
            children: createSupplyRangeChildren("entry_supply"),
          },
          {
            key: "entry_supply_obim",
            title: "OBIM",
            icon: Target,
            iconClassName: "",
            children: createSupplyDemandOBIMChildren("entry_supply"),
          },
        ],
      },
    ],
  },
  {
    key: "exit",
    title: "Exit",
    icon: LogOut,
    iconClassName: "",
    children: [
      {
        key: "exit_demand",
        title: "Demand",
        icon: TrendingUp,
        iconClassName: "text-emerald-500",
        anti: ["exit_supply"],
        children: [
          {
            key: "exit_demand_range",
            title: "Range",
            icon: Square,
            iconClassName: "",
            children: createDemandRangeChildren("exit_demand"),
          },
          {
            key: "exit_demand_obim",
            title: "OBIM",
            icon: Target,
            iconClassName: "",
            children: createSupplyDemandOBIMChildren("exit_demand"),
          },
        ],
      },
      {
        key: "exit_supply",
        title: "Supply",
        icon: TrendingDown,
        iconClassName: "text-rose-500",
        anti: ["exit_demand"],
        children: [
          {
            key: "exit_supply_range",
            title: "Range",
            icon: Square,
            iconClassName: "",
            children: createSupplyRangeChildren("exit_supply"),
          },
          {
            key: "exit_supply_obim",
            title: "OBIM",
            icon: Target,
            iconClassName: "",
            children: createSupplyDemandOBIMChildren("exit_supply"),
          },
        ],
      },
    ],
  },
];
