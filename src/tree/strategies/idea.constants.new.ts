/**
 * Idea Strategy - Class-based TreeNode implementation
 *
 * Factory function for creating the "Idea" trading strategy tree structure
 * using the new class-based TreeNode system.
 */

import bearishSupplyZoneImg from "@/assets/bearish_supply_zone.png";
import bullishDemandZoneImg from "@/assets/bullish_demand_zone.png";
import correctiveReturnImg from "@/assets/corrective_return.png";
import liquiditySweepReturnImg from "@/assets/liquidity_sweep_return.png";
import rangeDemandZoneImg from "@/assets/range_demand_zone.png";
import rangeSupplyZoneImg from "@/assets/range_supply_zone.png";
import roundedReturnImg from "@/assets/rounded_return.png";
import vShapeReturnImg from "@/assets/v_shape_return.png";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CircleDot,
  Droplets,
  GitBranch,
  MenuIcon,
  Mountain,
  Settings,
  Shield,
  Spline,
  Square,
  Target,
  TrendingDown,
  TrendingUp,
  Triangle,
  Waves,
} from "lucide-react";
import type { Timeframe } from "../../config/timeframe-order";
import {
  createDiscountPremiumPricing,
  createFVG,
  createOBIMWithTimeframes,
  createRangeWithTimeframes,
  createSupplyRangeWithTimeframes,
  createWyckoffWithTimeframes,
  customPrice,
} from "../tree.constants";
import {
  type StrategyFactory,
  TreeNode,
  type TreeNodeConfig,
  createTimeframeNodes,
} from "../tree.utils.new";

/**
 * Configuration type for Idea Strategy
 */
export interface IdeaStrategyConfig extends Record<string, unknown> {
  availableTimeframes?: Timeframe[];
}

/**
 * Helper function to create liquidity children nodes
 */
const createLiquidityChildren = (): TreeNodeConfig[] => [
  {
    key: "wicking_tops",
    title: "Wicking Tops",
    metadata: {
      icon: Mountain,
      iconClassName: "scale-x-[-1]",
    },
  },
  {
    key: "wicking_bottoms",
    title: "Wicking Bottoms",
    metadata: {
      icon: Mountain,
      iconClassName: "rotate-180",
    },
  },
  {
    key: "curve",
    title: "Curve",
    metadata: {
      iconClassName: "",
    },
    children: [
      {
        key: "below",
        title: "Below",
        metadata: {
          icon: Spline,
          iconClassName: "rotate-180 text-emerald-500",
          anti: ["above"],
        },
        children: [
          {
            key: "rounded",
            title: "Rounded",
            metadata: {
              icon: CircleDot,
              iconClassName: "text-emerald-500",
              description:
                "Liquidity is being left behind under the curve which may cause a quick sweep down, proving the supply zone successful",
              imageUrl: roundedReturnImg,
              anti: ["corrective", "sweep", "v_shape"],
            },
          },
          {
            key: "corrective",
            title: "Corrective",
            metadata: {
              icon: TrendingDown,
              iconClassName: "text-emerald-400",
              description:
                "Liquidity is being left behind under the trendline which may cause a quick sweep down, proving the supply zone successful",
              imageUrl: correctiveReturnImg,
              anti: ["rounded", "sweep", "v_shape"],
            },
          },
          {
            key: "sweep",
            title: "Sweep",
            metadata: {
              icon: Waves,
              iconClassName: "text-amber-500",
              description:
                "Liquidity is being taken on the way up, meaning that smart money may be engineering their positions. This could cause the supply zone to fail.",
              imageUrl: liquiditySweepReturnImg,
              anti: ["rounded", "corrective", "v_shape"],
            },
          },
          {
            key: "v_shape",
            title: "V-Shape",
            metadata: {
              icon: Triangle,
              iconClassName: "text-rose-500",
              description:
                "Aggressive return after the pivot was created, usually causes the supply/demand zone to fail",
              imageUrl: vShapeReturnImg,
              anti: ["rounded", "corrective", "sweep"],
            },
          },
        ],
      },
      {
        key: "above",
        title: "Above",
        metadata: {
          icon: Spline,
          iconClassName: "rotate-90 text-rose-500",
          anti: ["below"],
        },
        children: [
          {
            key: "rounded",
            title: "Rounded",
            metadata: {
              icon: CircleDot,
              iconClassName: "text-emerald-500",
              description:
                "Liquidity is being left behind above the curve which may cause a quick sweep up, proving the demand zone successful",
              imageUrl: roundedReturnImg,
              imageClassName: "rotate-180 -scale-x-100",
              anti: ["corrective", "sweep", "v_shape"],
            },
          },
          {
            key: "corrective",
            title: "Corrective",
            metadata: {
              icon: TrendingUp,
              iconClassName: "text-emerald-400",
              imageClassName: "rotate-180 -scale-x-100",
              description:
                "Liquidity is being left behind above the trendline which may cause a quick sweep up, proving the demand zone successful",
              imageUrl: correctiveReturnImg,
              anti: ["rounded", "sweep", "v_shape"],
            },
          },
          {
            key: "sweep",
            title: "Sweep",
            metadata: {
              icon: Waves,
              iconClassName: "text-amber-500",
              imageClassName: "rotate-180 -scale-x-100",
              description:
                "Liquidity is being taken on the way down, meaning that smart money may be engineering their positions. This could cause the demand zone to fail.",
              imageUrl: liquiditySweepReturnImg,
              anti: ["rounded", "corrective", "v_shape"],
            },
          },
          {
            key: "v_shape",
            title: "V-Shape",
            metadata: {
              icon: Triangle,
              iconClassName: "text-rose-500",
              description:
                "Aggressive return after the pivot was created, usually causes the supply/demand zone to fail",
              imageClassName: "rotate-180 -scale-x-100",
              imageUrl: vShapeReturnImg,
              anti: ["rounded", "corrective", "sweep"],
            },
          },
        ],
      },
    ],
  },
];

/**
 * Factory function to create the complete strategy tree with dynamic configuration.
 *
 * @param config - Configuration object containing availableTimeframes and other settings
 * @returns TreeNode[] - Array of TreeNode class instances
 */
export const createIdeaStrategyTree: StrategyFactory<IdeaStrategyConfig> = (
  config = {}
): TreeNode[] => {
  const { availableTimeframes = [] } = config;

  return [
    new TreeNode({
      key: "market_structure",
      title: "MS",
      metadata: {
        icon: BarChart3,
        iconClassName: "",
      },
      children: [
        {
          key: "swing",
          title: "Swing",
          metadata: {
            icon: Activity,
            iconClassName: "",
            isAddable: true,
            addButtonLabel: "Swing",
            addablePrefix: (originalKey, instanceNumber) =>
              `${originalKey}_#${instanceNumber}`,
          },

          children: createTimeframeNodes({
            prefix: "swing",
            availableTimeframes: availableTimeframes.map((tf) => tf.toString()),
            createChildren: () => [
              {
                key: "bullish",
                title: "Bullish",
                metadata: {
                  icon: TrendingUp,
                  iconClassName: "text-emerald-500",
                  anti: ["bearish"],
                },
              },
              {
                key: "bearish",
                title: "Bearish",
                metadata: {
                  icon: TrendingDown,
                  iconClassName: "text-rose-500",
                  anti: ["bullish"],
                },
              },
              {
                key: "range",
                title: "Range",
                metadata: {
                  icon: MenuIcon,
                  iconClassName: "text-sky-500/70",
                },
                children: createDiscountPremiumPricing(),
              },
              {
                key: "liquidity",
                title: "Liquidity",
                metadata: {
                  icon: Droplets,
                  iconClassName: "",
                },
                children: createLiquidityChildren(),
              },
            ],
          }),
        },
        {
          key: "fractal",
          title: "Fractal",

          metadata: {
            icon: GitBranch,
            iconClassName: "",
            isAddable: true,
            addButtonLabel: "Fractal",
            addablePrefix: (originalKey, instanceNumber) =>
              `${originalKey}_#${instanceNumber}`,
          },

          children: createTimeframeNodes({
            prefix: "fractal",
            availableTimeframes: availableTimeframes.map((tf) => tf.toString()),
            createChildren: () => [
              {
                key: "bullish",
                title: "Bullish",
                metadata: {
                  icon: TrendingUp,
                  iconClassName: "text-emerald-500",
                  anti: ["bearish"],
                },
              },
              {
                key: "bearish",
                title: "Bearish",
                metadata: {
                  icon: TrendingDown,
                  iconClassName: "text-rose-500",
                  anti: ["bullish"],
                },
              },
              {
                key: "range",
                title: "Range",
                metadata: {
                  icon: MenuIcon,
                  iconClassName: "text-sky-500/70",
                },
                children: createDiscountPremiumPricing(),
              },
              {
                key: "liquidity",
                title: "Liquidity",
                metadata: {
                  icon: Droplets,
                  iconClassName: "",
                },
                children: createLiquidityChildren(),
              },
            ],
          }),
        },
        {
          key: "optional_settings",
          title: "_+_",
          metadata: {
            icon: Settings,
            iconClassName: "",
            isDir: true,
          },
          children: [
            {
              key: "protected_levels",
              title: "Protected",
              metadata: {
                icon: Shield,
                iconClassName: "",
              },
              children: [
                {
                  key: "protected_high",
                  title: "High",
                  metadata: {
                    icon: ArrowUp,
                    iconClassName: "",
                    anti: ["protected_low"],
                    inputField: customPrice(),
                  },
                },
                {
                  key: "protected_low",
                  title: "Low",
                  metadata: {
                    icon: ArrowDown,
                    iconClassName: "",
                    anti: ["protected_high"],
                    inputField: customPrice(),
                  },
                },
              ],
            },
            {
              key: "weak_levels",
              title: "Weak",
              metadata: {
                icon: AlertTriangle,
                iconClassName: "",
              },
              children: [
                {
                  key: "weak_high",
                  title: "High",
                  metadata: {
                    icon: ArrowUp,
                    iconClassName: "",
                    anti: ["weak_low"],
                    inputField: customPrice(),
                  },
                },
                {
                  key: "weak_low",
                  title: "Low",
                  metadata: {
                    icon: ArrowDown,
                    iconClassName: "",
                    anti: ["weak_high"],
                    inputField: customPrice(),
                  },
                },
              ],
            },
          ],
        },
      ],
    }),
    new TreeNode({
      key: "demand",
      title: "Demand",
      metadata: {
        icon: TrendingUp,
        iconClassName: "text-emerald-500",
      },
      children: [
        {
          key: "range",
          title: "Range",
          metadata: {
            icon: Square,
            iconClassName: "",
            imageUrl: rangeDemandZoneImg,
            isAddable: true,
            addButtonLabel: "Add Range",
            addablePrefix: (originalKey, instanceNumber) =>
              `${originalKey}_#${instanceNumber}`,
          },
          children: createRangeWithTimeframes(availableTimeframes),
        },
        {
          key: "obim",
          title: "OBIM",
          metadata: {
            icon: Target,
            iconClassName: "",
            imageUrl: bullishDemandZoneImg,
            isAddable: true,
            addButtonLabel: "Add OBIM",
            addablePrefix: (originalKey, instanceNumber) =>
              `${originalKey}_#${instanceNumber}`,
          },
          children: createOBIMWithTimeframes(false, true, availableTimeframes),
        },
        {
          key: "wyckoff",
          title: "Wyckoff Acc.",
          metadata: {
            icon: Target,
            iconClassName: "",
            isAddable: true,
            addButtonLabel: "Wyckoff Acc.",
            addablePrefix: (originalKey, instanceNumber) =>
              `${originalKey}_#${instanceNumber}`,
          },
          children: createWyckoffWithTimeframes(
            availableTimeframes.map((tf) => tf.toString())
          ),
        },
        ...createFVG(availableTimeframes),
      ],
    }),
    new TreeNode({
      key: "supply",
      title: "Supply",
      metadata: {
        icon: TrendingDown,
        iconClassName: "text-rose-500",
      },
      children: [
        {
          key: "range",
          title: "Range",
          metadata: {
            icon: Square,
            iconClassName: "",
            imageUrl: rangeSupplyZoneImg,
            isAddable: true,
            addButtonLabel: "Add Range",
            // Custom prefix function for dynamic instances
            // Generates keys like: range_#1, range_#2, etc.
            addablePrefix: (originalKey, instanceNumber) =>
              `${originalKey}_#${instanceNumber}`,
          },
          children: createSupplyRangeWithTimeframes(availableTimeframes),
        },
        {
          key: "obim",
          title: "OBIM",
          metadata: {
            icon: Target,
            iconClassName: "",
            imageUrl: bearishSupplyZoneImg,
            isAddable: true,
            addButtonLabel: "Add OBIM",
            addablePrefix: (originalKey, instanceNumber) =>
              `${originalKey}_#${instanceNumber}`,
          },
          children: createOBIMWithTimeframes(true, false, availableTimeframes),
        },
        {
          key: "wyckoff",
          title: "Wyckoff Dis.",
          metadata: {
            icon: Target,
            iconClassName: "",
            isAddable: true,
            addButtonLabel: "Wyckoff Dis.",
            addablePrefix: (originalKey, instanceNumber) =>
              `${originalKey}_#${instanceNumber}`,
          },
          children: createWyckoffWithTimeframes(
            availableTimeframes.map((tf) => tf.toString())
          ),
        },
      ],
    }),
  ];
};

// Static tree for backward compatibility (uses empty config)
export const ideaStrategyTree: TreeNode[] = createIdeaStrategyTree({});
