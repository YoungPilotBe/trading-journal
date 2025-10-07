import {
  DollarSign,
  Mountain,
  MoveDownRight,
  MoveUpRight,
  Spline,
  Zap,
} from "lucide-react";
import type { TreeNodeConfig } from "../tree.utils.new";
import { constructAntiBranch, constructNode } from "../utils/node-creators";

import correctiveReturn from "@/assets/corrective_return.png";
import sweepReturn from "@/assets/liquidity_sweep_return.png";
import roundedReturn from "@/assets/rounded_return.png";
import vShapeReturn from "@/assets/v_shape_return.png";

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
        key: "above",
        title: "Above",
        metadata: {
          icon: Spline,
          iconClassName: "rotate-90 text-rose-500",
        },
        children: constructAntiBranch([
          {
            key: "rounded",
            title: "Rounded",
            metadata: {
              icon: Spline,
              iconClassName: "rotate-90 text-rose-500",
              imageClassName: "scale-x-[-1] rotate-180",
              imageUrl: roundedReturn,
            },
          },
          {
            key: "corrective",
            title: "Corrective",
            metadata: {
              icon: MoveDownRight,
              iconClassName: "text-rose-500",
              imageClassName: "scale-x-[-1] rotate-180",
              imageUrl: correctiveReturn,
            },
          },
          {
            key: "sweep",
            title: "Sweep",
            metadata: {
              icon: DollarSign,
              iconClassName: "text-amber-500",
              imageClassName: "scale-x-[-1] rotate-180",
              imageUrl: sweepReturn,
            },
          },
          {
            key: "v_shape",
            title: "V-Shape",
            metadata: {
              icon: Zap,
              iconClassName: "text-rose-500",
              imageClassName: "scale-x-[-1] rotate-180",
              imageUrl: vShapeReturn,
            },
          },
        ]),
      },
      {
        key: "below",
        title: "Below",
        metadata: {
          icon: Spline,
          iconClassName: "rotate-180 text-emerald-500",
        },
        children: constructAntiBranch([
          {
            key: "rounded",
            title: "Rounded",
            metadata: {
              icon: Spline,
              iconClassName: "rotate-180 text-emerald-500",
              imageUrl: roundedReturn,
            },
          },
          {
            key: "corrective",
            title: "Corrective",
            metadata: {
              icon: MoveUpRight,
              iconClassName: "text-emerald-400",
              imageUrl: correctiveReturn,
            },
          },
          {
            key: "sweep",
            title: "Sweep",
            metadata: {
              icon: DollarSign,
              iconClassName: "text-amber-500",
              imageUrl: sweepReturn,
            },
          },
          {
            key: "v_shape",
            title: "V-Shape",
            metadata: {
              icon: Zap,
              iconClassName: "text-rose-500",
              imageUrl: vShapeReturn,
            },
          },
        ]),
      },
    ]),
  }),
];
