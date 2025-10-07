import {
  CircleDot,
  Mountain,
  Spline,
  TrendingDown,
  TrendingUp,
  Triangle,
  Waves,
} from "lucide-react";
import type { TreeNodeConfig } from "../tree.utils.new";
import { constructAntiBranch, constructNode } from "../utils/node-creators";

/**
 * Basic liquidity children
 */
export const createLiquidityChildren = (): TreeNodeConfig[] => [
  constructNode("fueled", "Fueled"),
  constructNode("wicked", "Wicked"),
];

/**
 * Detailed liquidity children with return patterns
 */
export const createDetailedLiquidityChildren = (): TreeNodeConfig[] => [
  constructNode("wicking_tops", "Wicking Tops", {
    icon: Mountain,
    iconClassName: "scale-x-[-1]",
  }),
  constructNode("wicking_bottoms", "Wicking Bottoms", {
    icon: Mountain,
    iconClassName: "rotate-180",
  }),
  constructNode("curve", "Curve", {
    children: constructAntiBranch([
      {
        key: "below",
        title: "Below",
        icon: Spline,
        iconClassName: "rotate-180 text-emerald-500",
        children: constructAntiBranch([
          {
            key: "rounded",
            title: "Rounded",
            icon: CircleDot,
            iconClassName: "text-emerald-500",
          },
          {
            key: "corrective",
            title: "Corrective",
            icon: TrendingDown,
            iconClassName: "text-emerald-400",
          },
          {
            key: "sweep",
            title: "Sweep",
            icon: Waves,
            iconClassName: "text-amber-500",
          },
          {
            key: "v_shape",
            title: "V-Shape",
            icon: Triangle,
            iconClassName: "text-rose-500",
          },
        ]),
      },
      {
        key: "above",
        title: "Above",
        icon: Spline,
        iconClassName: "rotate-90 text-rose-500",
        children: constructAntiBranch([
          {
            key: "rounded",
            title: "Rounded",
            icon: CircleDot,
            iconClassName: "text-emerald-500",
          },
          {
            key: "corrective",
            title: "Corrective",
            icon: TrendingUp,
            iconClassName: "text-emerald-400",
          },
          {
            key: "sweep",
            title: "Sweep",
            icon: Waves,
            iconClassName: "text-amber-500",
          },
          {
            key: "v_shape",
            title: "V-Shape",
            icon: Triangle,
            iconClassName: "text-rose-500",
          },
        ]),
      },
    ]),
  }),
];
