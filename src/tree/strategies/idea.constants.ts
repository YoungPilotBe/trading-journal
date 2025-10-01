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
  Clock,
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
  createOBIMWithTimeframes,
  createRangeWithTimeframes,
  createSupplyRangeWithTimeframes,
  customPrice,
} from "../tree.constants";
import {
  createTimeframeNode,
  type StrategyFactory,
  type TreeNode,
} from "../tree.utils";

/**
 * Configuration type for Idea Strategy
 */
export interface IdeaStrategyConfig extends Record<string, unknown> {
  availableTimeframes?: Timeframe[];
  // Add more config options here as needed
  // showAdvancedOptions?: boolean;
  // customSettings?: {...};
}

// Factory function to create timeframe-specific bullish/bearish options

// Helper function to create liquidity options for swing/fractal
const createLiquidityChildren = (prefix: string): TreeNode[] => [
  {
    key: `${prefix}_wicking_tops`,
    title: "Wicking Tops",
    icon: Mountain,
    iconClassName: "scale-x-[-1]",
  },
  {
    key: `${prefix}_wicking_bottoms`,
    title: "Wicking Bottoms",
    icon: Mountain,
    iconClassName: "rotate-180",
  },
  {
    key: `${prefix}_liquidity_curve`,
    title: "Curve",
    iconClassName: "",
    children: [
      {
        key: `${prefix}_liquidity_curve_below`,
        title: "Below",
        icon: Spline,
        iconClassName: "rotate-180 text-emerald-500",
        anti: [`${prefix}_liquidity_curve_above`],
        children: [
          {
            key: `${prefix}_return_rounded`,
            title: "Rounded",
            icon: CircleDot,
            iconClassName: "text-emerald-500",
            description:
              "Liquidity is being left behind under the curve which may cause a quick sweep down, proving the supply zone successful",
            imageUrl: roundedReturnImg,
            anti: [
              `${prefix}_return_corrective`,
              `${prefix}_return_sweep`,
              `${prefix}_return_v_shape`,
            ],
          },
          {
            key: `${prefix}_return_corrective`,
            title: "Corrective",
            icon: TrendingDown,
            iconClassName: "text-emerald-400",
            description:
              "Liquidity is being left behind under the trendline which may cause a quick sweep down, proving the supply zone successful",
            imageUrl: correctiveReturnImg,
            anti: [
              `${prefix}_return_rounded`,
              `${prefix}_return_sweep`,
              `${prefix}_return_v_shape`,
            ],
          },
          {
            key: `${prefix}_return_sweep`,
            title: "Sweep",
            icon: Waves,
            iconClassName: "text-amber-500",
            description:
              "Liquidity is being taken on the way up, meaning that smart money may be engineering their positions. This could cause the supply zone to fail.",
            imageUrl: liquiditySweepReturnImg,
            anti: [
              `${prefix}_return_rounded`,
              `${prefix}_return_corrective`,
              `${prefix}_return_v_shape`,
            ],
          },
          {
            key: `${prefix}_return_v_shape`,
            title: "V-Shape",
            icon: Triangle,
            iconClassName: "text-rose-500",
            description:
              "Aggressive return after the pivot was created, usually causes the supply/demand zone to fail",
            imageUrl: vShapeReturnImg,
            anti: [
              `${prefix}_return_rounded`,
              `${prefix}_return_corrective`,
              `${prefix}_return_sweep`,
            ],
          },
        ],
      },
      {
        key: `${prefix}_liquidity_curve_above`,
        title: "Above",
        icon: Spline,
        iconClassName: "rotate-90 text-rose-500",
        anti: [`${prefix}_liquidity_curve_below`],
        children: [
          {
            key: `${prefix}_return_rounded`,
            title: "Rounded",
            icon: CircleDot,
            iconClassName: "text-emerald-500",
            description:
              "Liquidity is being left behind above the curve which may cause a quick sweep up, proving the demand zone successful",
            imageUrl: roundedReturnImg,
            imageClassName: "rotate-180 -scale-x-100",
            anti: [
              `${prefix}_return_corrective`,
              `${prefix}_return_sweep`,
              `${prefix}_return_v_shape`,
            ],
          },
          {
            key: `${prefix}_return_corrective`,
            title: "Corrective",
            icon: TrendingUp,
            iconClassName: "text-emerald-400",
            imageClassName: "rotate-180 -scale-x-100",
            description:
              "Liquidity is being left behind above the trendline which may cause a quick sweep up, proving the demand zone successful",
            imageUrl: correctiveReturnImg,
            anti: [
              `${prefix}_return_rounded`,
              `${prefix}_return_sweep`,
              `${prefix}_return_v_shape`,
            ],
          },
          {
            key: `${prefix}_return_sweep`,
            title: "Sweep",
            icon: Waves,
            iconClassName: "text-amber-500",
            imageClassName: "rotate-180 -scale-x-100",
            description:
              "Liquidity is being taken on the way down, meaning that smart money may be engineering their positions. This could cause the demand zone to fail.",
            imageUrl: liquiditySweepReturnImg,
            anti: [
              `${prefix}_return_rounded`,
              `${prefix}_return_corrective`,
              `${prefix}_return_v_shape`,
            ],
          },
          {
            key: `${prefix}_return_v_shape`,
            title: "V-Shape",
            icon: Triangle,
            iconClassName: "text-rose-500",
            description:
              "Aggressive return after the pivot was created, usually causes the supply/demand zone to fail",
            imageClassName: "rotate-180 -scale-x-100",
            imageUrl: vShapeReturnImg,
            anti: [
              `${prefix}_return_rounded`,
              `${prefix}_return_corrective`,
              `${prefix}_return_sweep`,
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Factory function to create the complete strategy tree with dynamic configuration.
 *
 * This is a type-safe strategy factory that accepts configuration via context or directly.
 *
 * @param config - Configuration object containing availableTimeframes and other settings
 * @returns TreeNode[] - The complete strategy tree
 *
 * @example
 * // Direct usage with config object
 * const strategy = createIdeaStrategyTree({
 *   availableTimeframes: ['1m', '5m', '15m']
 * })
 *
 * @example
 * // Usage with TreeProvider strategyFactory
 * <TreeProvider
 *   strategyFactory={createIdeaStrategyTree}
 *   strategyConfig={{ availableTimeframes: ['1m', '5m'] }}
 * >
 *   <Tree />
 * </TreeProvider>
 */
export const createIdeaStrategyTree: StrategyFactory<IdeaStrategyConfig> = (
  config = {}
): TreeNode[] => {
  const { availableTimeframes = [] } = config;

  return [
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
          children: createTimeframeNode({
            prefix: "swing",
            availableTimeframes: availableTimeframes.map((tf) => tf.toString()),
            createChildren: (timeframePrefix) => [
              {
                key: `${timeframePrefix}_bullish`,
                title: "Bullish",
                icon: TrendingUp,
                iconClassName: "text-emerald-500",
                anti: [`${timeframePrefix}_bearish`],
                children: [], // No children for bullish/bearish in this case
              },
              {
                key: `${timeframePrefix}_bearish`,
                title: "Bearish",
                icon: TrendingDown,
                iconClassName: "text-rose-500",
                anti: [`${timeframePrefix}_bullish`],
                children: [], // No children for bullish/bearish in this case
              },
              {
                key: `${timeframePrefix}_range`,
                title: "Range",
                icon: MenuIcon,
                iconClassName: "text-sky-500/70",
                children: createDiscountPremiumPricing(
                  `${timeframePrefix}_range`
                ),
              },
              {
                key: `${timeframePrefix}_liquidity`,
                title: "Liquidity",
                icon: Droplets,
                iconClassName: "",
                children: createLiquidityChildren(
                  `${timeframePrefix}_liquidity`
                ),
              },
            ],
            icon: Clock,
            iconClassName: "text-muted-foreground",
          }),
        },
        {
          key: "fractal",
          title: "Fractal",
          icon: GitBranch,
          iconClassName: "",
          children: createTimeframeNode({
            prefix: "fractal",
            availableTimeframes: availableTimeframes.map((tf) => tf.toString()),
            createChildren: (timeframePrefix) => [
              {
                key: `${timeframePrefix}_bullish`,
                title: "Bullish",
                icon: TrendingUp,
                iconClassName: "text-emerald-500",
                anti: [`${timeframePrefix}_bearish`],
                children: [], // No children for bullish/bearish in this case
              },
              {
                key: `${timeframePrefix}_bearish`,
                title: "Bearish",
                icon: TrendingDown,
                iconClassName: "text-rose-500",
                anti: [`${timeframePrefix}_bullish`],
                children: [], // No children for bullish/bearish in this case
              },
              {
                key: `${timeframePrefix}_range`,
                title: "Range",
                icon: MenuIcon,
                iconClassName: "text-sky-500/70",
                children: createDiscountPremiumPricing(
                  `${timeframePrefix}_range`
                ),
              },
              {
                key: `${timeframePrefix}_liquidity`,
                title: "Liquidity",
                icon: Droplets,
                iconClassName: "",
                children: createLiquidityChildren(
                  `${timeframePrefix}_liquidity`
                ),
              },
            ],
            icon: Clock,
            iconClassName: "text-muted-foreground",
          }),
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
          ],
        },
      ],
    },
    {
      key: "demand",
      title: "Demand",
      icon: TrendingUp,
      iconClassName: "text-emerald-500",
      children: [
        {
          key: "demand_range",
          title: "Range",
          icon: Square,
          iconClassName: "",
          imageUrl: rangeDemandZoneImg,
          children: createRangeWithTimeframes("demand", availableTimeframes),
        },
        {
          key: "demand_obim",
          title: "OBIM",
          icon: Target,
          iconClassName: "",
          imageUrl: bullishDemandZoneImg,
          children: createOBIMWithTimeframes("demand", availableTimeframes),
        },
      ],
    },
    {
      key: "supply",
      title: "Supply",
      icon: TrendingDown,
      iconClassName: "text-rose-500",
      children: [
        {
          key: "supply_range",
          title: "Range",
          icon: Square,
          iconClassName: "",
          imageUrl: rangeSupplyZoneImg,
          children: createSupplyRangeWithTimeframes(
            "supply",
            availableTimeframes
          ),
        },
        {
          key: "supply_obim",
          title: "OBIM",
          icon: Target,
          iconClassName: "",
          imageUrl: bearishSupplyZoneImg,
          children: createOBIMWithTimeframes("supply", availableTimeframes),
        },
      ],
    },
  ];
};

// Static tree for backward compatibility (uses empty config)
export const ideaStrategyTree: TreeNode[] = createIdeaStrategyTree({});
