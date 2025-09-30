import bearishOBIMImg from "@/assets/bearish_order_block_imbalance.png";
import bearishOBIM25Img from "@/assets/bearish_order_block_imbalance_25_percent.png";
import bullishOBIMImg from "@/assets/bullish_order_block_imbalance.png";
import bullishOBIM25Img from "@/assets/bullish_order_block_imbalance_25_percent.png";
import extremumDPImg from "@/assets/extremum_decision_point.png";
import { capitalize } from "lodash";
import { ChevronDown, ChevronUp, ChevronsDown, ChevronsUp } from "lucide-react";
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
export const createSupplyDemandOBIMChildren = (prefix: string) => {
  const isSupply = prefix.includes("supply");
  const isDemand = prefix.includes("demand");

  return [
    {
      key: `${prefix}_obim_extension`,
      title: "Extension",
      children: [
        {
          key: `${prefix}_obim_extension_fvg`,
          title: "FVG",
          imageUrl: isSupply
            ? bearishOBIMImg
            : isDemand
              ? bullishOBIMImg
              : undefined,
        },
        {
          key: `${prefix}_obim_extension_25_percent`,
          title: "25%",
          imageUrl: isSupply
            ? bearishOBIM25Img
            : isDemand
              ? bullishOBIM25Img
              : undefined,
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
          imageUrl: extremumDPImg,
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
};

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
