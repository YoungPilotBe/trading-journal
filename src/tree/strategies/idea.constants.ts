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
  LogIn,
  LogOut,
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
  createDemandRangeChildren,
  createDiscountPremiumPricing,
  createSupplyDemandOBIMChildren,
  createSupplyRangeChildren,
  customPrice,
} from "../tree.constants";
import {
  createTimeframeChildren,
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
const createTimeframeBullishBearishChildren = (
  prefix: string,
  availableTimeframes: Timeframe[] = []
): TreeNode[] => {
  // Create bullish timeframe options
  const bullishNode: TreeNode = {
    key: `${prefix}_bullish`,
    title: "Bullish",
    icon: TrendingUp,
    iconClassName: "text-emerald-500",
    anti: [`${prefix}_bearish`],
    children: availableTimeframes.map((timeframe) => ({
      key: `${prefix}_bullish_${timeframe}`,
      title: timeframe,
      icon: Clock,
      iconClassName: "text-emerald-500/70",
      // Anti keys prevent selecting multiple timeframes for the same direction
      anti: availableTimeframes
        .filter((tf) => tf !== timeframe)
        .flatMap((tf) => [
          `${prefix}_bullish_${tf}`,
          `${prefix}_bearish_${tf}`,
        ]),
    })),
  };

  // Create bearish timeframe options
  const bearishNode: TreeNode = {
    key: `${prefix}_bearish`,
    title: "Bearish",
    icon: TrendingDown,
    iconClassName: "text-rose-500",
    anti: [`${prefix}_bullish`],
    children: availableTimeframes.map((timeframe) => ({
      key: `${prefix}_bearish_${timeframe}`,
      title: timeframe,
      icon: Clock,
      iconClassName: "text-rose-500/70",
      // Anti keys prevent selecting multiple timeframes for the same direction
      anti: availableTimeframes
        .filter((tf) => tf !== timeframe)
        .flatMap((tf) => [
          `${prefix}_bullish_${tf}`,
          `${prefix}_bearish_${tf}`,
        ]),
    })),
  };

  return [bullishNode, bearishNode];
};

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
            description:
              "Liquidity is being left behind above the trendline which may cause a quick sweep up, proving the demand zone successful",
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
              "Liquidity is being taken on the way down, meaning that smart money may be engineering their positions. This could cause the demand zone to fail.",
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
          children: [
            {
              key: `swing_bullish`,
              title: "Bullish",
              icon: TrendingUp,
              iconClassName: "text-emerald-500",
              anti: [`swing_bearish`],
              children: createTimeframeChildren(
                `swing_bullish`,
                availableTimeframes,
                "text-emerald-500/70"
              ),
            },

            {
              key: `swing_bearish`,
              title: "Bearish",
              icon: TrendingDown,
              iconClassName: "text-rose-500",
              anti: [`swing_bullish`],
              children: createTimeframeChildren(
                `swing_bearish`,
                availableTimeframes,
                "text-rose-500/70"
              ),
            },
            {
              key: "swing_range",
              title: "Range",
              icon: MenuIcon,
              iconClassName: "text-sky-500/70",
              children: createDiscountPremiumPricing("swing_range"),
            },
            {
              key: "swing_liquidity",
              title: "Liquidity",
              icon: Droplets,
              iconClassName: "",
              children: createLiquidityChildren("swing_liquidity"),
            },
          ],
        },
        {
          key: "fractal",
          title: "Fractal",
          icon: GitBranch,
          iconClassName: "",
          children: [
            ...createTimeframeBullishBearishChildren(
              "fractal",
              availableTimeframes
            ),
            {
              key: "fractal_range",
              title: "Range",
              icon: MenuIcon,
              iconClassName: "text-sky-500/70",
              children: createDiscountPremiumPricing("fractal_range"),
            },
            {
              key: "fractal_liquidity",
              title: "Liquidity",
              icon: Droplets,
              iconClassName: "",
              children: createLiquidityChildren("fractal_liquidity"),
            },
          ],
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
};

// Static tree for backward compatibility (uses empty config)
export const ideaStrategyTree: TreeNode[] = createIdeaStrategyTree({});
