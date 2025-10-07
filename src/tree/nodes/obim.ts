import bearishOBIMImg from "@/assets/bearish_order_block_imbalance.png";
import bearishOBIM25Img from "@/assets/bearish_order_block_imbalance_25_percent.png";
import bullishOBIMImg from "@/assets/bullish_order_block_imbalance.png";
import bullishOBIM25Img from "@/assets/bullish_order_block_imbalance_25_percent.png";
import extremumDPImg from "@/assets/extremum_decision_point.png";

import goodOrderBlockBosBreak from "@/assets/good_order_block_bos_break.png";
import goodOrderBlockLiquidity from "@/assets/good_order_block_liquidity.png";
import goodOrderBlockZoneFail from "@/assets/good_order_block_zone_fail.png";

import { Ban, CloudLightning, DollarSign } from "lucide-react";
import type { TreeNodeConfig } from "../tree.utils.new";
import {
  constructNode,
  createTimeframedChildren,
} from "../utils/node-creators";
import { createFixedRangeConfluenceChildren } from "./fixed-range";

/**
 * OBIM children for Supply/Demand
 */
export const createSupplyDemandOBIMChildren = (
  isSupply: boolean,
  isDemand: boolean
): TreeNodeConfig[] => [
  {
    ...constructNode("confirmations", "Confirmations", {
      isConfirmation: true,
      children: [
        constructNode("bos_break", "BOS Break", {
          icon: CloudLightning,
          isConfirmation: true,
          imageUrl: goodOrderBlockBosBreak,
        }),
        constructNode("liquidity_grab", "Liq. Grab", {
          icon: DollarSign,
          isConfirmation: true,
          imageUrl: goodOrderBlockLiquidity,
        }),
        constructNode(
          `${isDemand ? "supply" : "demand"}_failed`,
          `${isDemand ? "Supply" : "Demand"} Failed`,
          {
            icon: Ban,
            isConfirmation: true,
            description: `Previous ${isDemand ? "supply" : "demand"} failed to put in a ${isDemand ? "low" : "high"} and thus creates
    a ${isDemand ? "demand" : "supply"} zone, within there may be an order block`,
            imageUrl: goodOrderBlockZoneFail,
          }
        ),
      ],
    }),
    metadata: {
      ...constructNode("confirmations", "").metadata,
      isConfirmation: true,
    },
  },
  {
    ...constructNode("extension", "Extension", {
      children: [
        constructNode("fvg", "FVG", {
          imageUrl: isSupply
            ? bearishOBIMImg
            : isDemand
              ? bullishOBIMImg
              : undefined,
        }),
        constructNode("wick_25_percent", "Wick 25%", {
          imageUrl: isSupply
            ? bearishOBIM25Img
            : isDemand
              ? bullishOBIM25Img
              : undefined,
        }),
      ],
    }),
  },
  constructNode("inducement", "Inducement"),
  {
    ...constructNode("pivot", "Pivot", {
      children: [
        constructNode("ep", "EP"),
        constructNode("dp", "DP", { imageUrl: extremumDPImg }),
      ],
    }),
  },
  {
    ...constructNode("fixed_range_confluence", "Fixed Range Confluence", {
      children: createFixedRangeConfluenceChildren(),
    }),
  },
];

/**
 * OBIM with timeframes
 */
export const createOBIMWithTimeframes = (
  isSupply: boolean,
  isDemand: boolean,
  availableTimeframes: string[] = []
) =>
  createTimeframedChildren("obim", availableTimeframes, () =>
    createSupplyDemandOBIMChildren(isSupply, isDemand)
  );
