import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Clock,
  Droplets,
  GitBranch,
  LogIn,
  LogOut,
  Settings,
  Shield,
  Spline,
  Square,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { Timeframe } from "../../config/timeframe-order";
import {
  createDemandRangeChildren,
  createDiscountPremiumPricing,
  createSupplyDemandOBIMChildren,
  createSupplyRangeChildren,
  customPrice,
} from "../tree.constants";
import { createTimeframeChildren, type TreeNode } from "../tree.utils";

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

// Factory function to create the complete strategy tree with dynamic timeframes
export const createIdeaStrategyTree = (
  availableTimeframes: Timeframe[] = []
): TreeNode[] => [
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
            children: createDiscountPremiumPricing("swing_range"),
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
            children: createDiscountPremiumPricing("fractal_range"),
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
          {
            key: "market_structure_liquidity",
            title: "Liquidity",
            icon: Droplets,
            iconClassName: "",
            children: [
              {
                key: "wicking_tops",
                title: "Wicking Tops",
              },
              {
                key: "wicking_bottoms",
                title: "Wicking Bottoms",
              },
              {
                key: "liquidity_curve",
                title: "Curve",
                iconClassName: "",
                children: [
                  {
                    key: "liquidity_above",
                    title: "Above",
                    children: [
                      {
                        key: "liquidity_curve_up_above",
                        title: "Up",
                        icon: Spline,
                        iconClassName: "rotate-180 text-emerald-500",
                        anti: ["liquidity_curve_down_above"],
                      },
                      {
                        key: "liquidity_curve_down_above",
                        title: "Down",
                        icon: Spline,
                        iconClassName: "rotate-90 text-rose-500",
                        anti: ["liquidity_curve_up_above"],
                      },
                    ],
                  },
                  {
                    key: "liquidity_below",
                    title: "Below",
                    children: [
                      {
                        key: "liquidity_curve_up_below",
                        title: "Up",
                        icon: Spline,
                        iconClassName: "rotate-180 text-emerald-500",
                        anti: ["liquidity_curve_down_below"],
                      },
                      {
                        key: "liquidity_curve_down_below",
                        title: "Down",
                        icon: Spline,
                        iconClassName: "rotate-90 text-rose-500",
                        anti: ["liquidity_curve_up_below"],
                      },
                    ],
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

// Static tree for backward compatibility (uses empty timeframes array)
export const ideaStrategyTree: TreeNode[] = createIdeaStrategyTree();
