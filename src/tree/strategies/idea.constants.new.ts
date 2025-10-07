/**
 * Idea Strategy - Simplified TreeNode implementation
 *
 * Factory function for creating the "Idea" trading strategy tree structure
 * using simple, reusable helper functions.
 */

import bearishSupplyZoneImg from "@/assets/bearish_supply_zone.png";
import bullishDemandZoneImg from "@/assets/bullish_demand_zone.png";
import rangeDemandZoneImg from "@/assets/range_demand_zone.png";
import rangeSupplyZoneImg from "@/assets/range_supply_zone.png";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Droplets,
  GitBranch,
  MenuIcon,
  Settings,
  Shield,
  Square,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { Timeframe } from "../../config/timeframe-order";
import { createFVG } from "../nodes/fvg";
import { createDetailedLiquidityChildren } from "../nodes/liquidity";
import { createOBIMWithTimeframes } from "../nodes/obim";
import { createDiscountPremiumPricing } from "../nodes/premium-discount";
import {
  createRangeWithTimeframes,
  createSupplyRangeWithTimeframes,
} from "../nodes/ranges";
import { createWyckoffWithTimeframes } from "../nodes/wyckoff";
import { type StrategyFactory, TreeNode } from "../tree.utils.new";
import { customPrice } from "../utils/input-schemas";
import {
  constructAntiBranch,
  constructNode,
  createTimeframedChildren,
} from "../utils/node-creators";

/**
 * Configuration type for Idea Strategy
 */
export interface IdeaStrategyConfig extends Record<string, unknown> {
  availableTimeframes?: Timeframe[];
}

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
  const timeframeStrings = availableTimeframes.map((tf) => tf.toString());

  return [
    new TreeNode({
      key: "market_structure",
      title: "MS",
      metadata: { icon: BarChart3 },
      children: [
        // Swing with timeframes
        constructNode("swing", "Swing", {
          icon: Activity,
          isAddable: true,
          addButtonLabel: "Swing",
          addablePrefix: (key: string, num: number) => `${key}_#${num}`,
          children: createTimeframedChildren("swing", timeframeStrings, () => [
            ...constructAntiBranch([
              {
                key: "bullish",
                title: "Bullish",
                metadata: {
                  icon: TrendingUp,
                  iconClassName: "text-emerald-500",
                },
              },
              {
                key: "bearish",
                title: "Bearish",
                metadata: {
                  icon: TrendingDown,
                  iconClassName: "text-rose-500",
                },
              },
            ]),
            constructNode("range", "Range", {
              icon: MenuIcon,
              iconClassName: "text-sky-500/70",
              children: createDiscountPremiumPricing(),
            }),
            constructNode("liquidity", "Liquidity", {
              icon: Droplets,
              children: createDetailedLiquidityChildren(),
            }),
          ]),
        }),

        // Fractal with timeframes
        constructNode("fractal", "Fractal", {
          icon: GitBranch,
          isAddable: true,
          addButtonLabel: "Fractal",
          addablePrefix: (key: string, num: number) => `${key}_#${num}`,
          children: createTimeframedChildren(
            "fractal",
            timeframeStrings,
            () => [
              ...constructAntiBranch([
                {
                  key: "bullish",
                  title: "Bullish",
                  metadata: {
                    icon: TrendingUp,
                    iconClassName: "text-emerald-500",
                  },
                },
                {
                  key: "bearish",
                  title: "Bearish",
                  metadata: {
                    icon: TrendingDown,
                    iconClassName: "text-rose-500",
                  },
                },
              ]),
              constructNode("range", "Range", {
                icon: MenuIcon,
                iconClassName: "text-sky-500/70",
                children: createDiscountPremiumPricing(),
              }),
              constructNode("liquidity", "Liquidity", {
                icon: Droplets,
                children: createDetailedLiquidityChildren(),
              }),
            ]
          ),
        }),

        // Optional settings
        constructNode("optional_settings", "_+_", {
          icon: Settings,
          isDir: true,
          children: [
            constructNode("protected_levels", "Protected", {
              icon: Shield,
              children: constructAntiBranch([
                {
                  key: "protected_high",
                  title: "High",
                  metadata: {
                    icon: ArrowUp,
                    inputField: customPrice(),
                  },
                },
                {
                  key: "protected_low",
                  title: "Low",
                  metadata: {
                    icon: ArrowDown,
                    inputField: customPrice(),
                  },
                },
              ]),
            }),
            constructNode("weak_levels", "Weak", {
              icon: AlertTriangle,
              children: constructAntiBranch([
                {
                  key: "weak_high",
                  title: "High",
                  metadata: {
                    icon: ArrowUp,
                    inputField: customPrice(),
                  },
                },
                {
                  key: "weak_low",
                  title: "Low",
                  metadata: {
                    icon: ArrowDown,
                    inputField: customPrice(),
                  },
                },
              ]),
            }),
          ],
        }),
      ],
    }),

    // Demand section
    new TreeNode({
      key: "demand",
      title: "Demand",
      metadata: { icon: TrendingUp, iconClassName: "text-emerald-500" },
      children: [
        constructNode("range", "Range", {
          icon: Square,
          imageUrl: rangeDemandZoneImg,
          isAddable: true,
          addButtonLabel: "Add Range",
          addablePrefix: (key: string, num: number) => `${key}_#${num}`,
          children: createRangeWithTimeframes(availableTimeframes),
        }),
        constructNode("obim", "OBIM", {
          icon: Target,
          imageUrl: bullishDemandZoneImg,
          isAddable: true,
          addButtonLabel: "Add OBIM",
          addablePrefix: (key: string, num: number) => `${key}_#${num}`,
          children: createOBIMWithTimeframes(false, true, availableTimeframes),
        }),
        constructNode("wyckoff", "Wyckoff Acc.", {
          icon: Target,
          isAddable: true,
          addButtonLabel: "Wyckoff Acc.",
          addablePrefix: (key: string, num: number) => `${key}_#${num}`,
          children: createWyckoffWithTimeframes(timeframeStrings),
        }),
        ...createFVG(availableTimeframes),
      ],
    }),

    // Supply section
    new TreeNode({
      key: "supply",
      title: "Supply",
      metadata: { icon: TrendingDown, iconClassName: "text-rose-500" },
      children: [
        constructNode("range", "Range", {
          icon: Square,
          imageUrl: rangeSupplyZoneImg,
          isAddable: true,
          addButtonLabel: "Add Range",
          addablePrefix: (key: string, num: number) => `${key}_#${num}`,
          children: createSupplyRangeWithTimeframes(availableTimeframes),
        }),
        constructNode("obim", "OBIM", {
          icon: Target,
          imageUrl: bearishSupplyZoneImg,
          isAddable: true,
          addButtonLabel: "Add OBIM",
          addablePrefix: (key: string, num: number) => `${key}_#${num}`,
          children: createOBIMWithTimeframes(true, false, availableTimeframes),
        }),
        constructNode("wyckoff", "Wyckoff Dis.", {
          icon: Target,
          isAddable: true,
          addButtonLabel: "Wyckoff Dis.",
          addablePrefix: (key: string, num: number) => `${key}_#${num}`,
          children: createWyckoffWithTimeframes(timeframeStrings),
        }),
      ],
    }),
  ];
};

// Static tree for backward compatibility (uses empty config)
export const ideaStrategyTree: TreeNode[] = createIdeaStrategyTree({});
