import { DotIcon, Lock, Zap } from "lucide-react";
import { createTimeframeNodes, type TreeNodeConfig } from "../tree.utils.new";
import {
  constructAntiBranch,
  constructNode,
  createTimeframedChildren,
  treeNodeToConfig,
} from "../utils/node-creators";
import { createFixedRangeConfluenceChildren } from "./fixed-range";

/**
 * Demand Range children
 */
export const createDemandRangeChildren = (
  availableTimeframes: string[]
): TreeNodeConfig[] => [
  {
    ...constructNode("confirmations", "Confirmations", {
      isConfirmation: true,
      children: [
        constructNode("midpoint", "Midpoint", {
          icon: DotIcon,
          isConfirmation: true,
        }),
      ],
    }),
    metadata: {
      ...constructNode("confirmations", "").metadata,
      isConfirmation: true,
    },
  },
  constructNode("deviation", "Deviation", {
    children: constructAntiBranch([
      {
        key: "range_high",
        title: "Range High",
        children: [
          constructNode("confirmations", "Confirmations", {
            isConfirmation: true,
            children: [
              constructNode("reclaim", "Reclaim", {
                icon: Lock,
                isConfirmation: true,
              }),
              constructNode("bos_break", "Bos Break", {
                icon: Zap,
                isConfirmation: true,
                children: createTimeframeNodes({
                  availableTimeframes,
                  prefix: "bos_break",
                }).map(treeNodeToConfig),
              }),
            ],
          }),
        ],
      },
      {
        key: "range_low",
        title: "Range Low",
        children: [
          constructNode("confirmations", "Confirmations", {
            isConfirmation: true,
            children: [
              constructNode("reclaim", "Reclaim", {
                icon: Lock,
                isConfirmation: true,
              }),
              constructNode("bos_break", "Bos Break", {
                icon: Zap,
                isConfirmation: true,
                children: createTimeframeNodes({
                  availableTimeframes,
                  prefix: "bos_break",
                }).map(treeNodeToConfig),
              }),
            ],
          }),
        ],
      },
    ]),
  }),
  constructNode("inducement", "Inducement"),
  {
    ...constructNode("fixed_range_confluence", "Fixed Range Confluence", {
      children: createFixedRangeConfluenceChildren(),
    }),
  },
];

/**
 * Demand Range with timeframes
 */
export const createRangeWithTimeframes = (availableTimeframes: string[] = []) =>
  createTimeframedChildren("range", availableTimeframes, () =>
    createDemandRangeChildren(availableTimeframes)
  );

/**
 * Supply Range children
 */
export const createSupplyRangeChildren = (
  availableTimeframes: string[] = []
): TreeNodeConfig[] => [
  {
    ...constructNode("confirmations", "Confirmations", {
      isConfirmation: true,
      children: [
        constructNode("midpoint", "Midpoint", {
          icon: DotIcon,
          isConfirmation: true,
        }),
      ],
    }),
    metadata: {
      ...constructNode("confirmations", "").metadata,
      isConfirmation: true,
    },
  },
  constructNode("deviation", "Deviation", {
    children: constructAntiBranch([
      {
        key: "range_high",
        title: "Range High",
        children: [
          constructNode("confirmations", "Confirmations", {
            isConfirmation: true,
            children: [
              constructNode("reclaim", "Reclaim", {
                icon: Lock,
                isConfirmation: true,
              }),
              constructNode("bos_break", "Bos Break", {
                icon: Zap,
                isConfirmation: true,
                children: createTimeframeNodes({
                  availableTimeframes,
                  prefix: "bos_break",
                }).map(treeNodeToConfig),
              }),
            ],
          }),
        ],
      },
      {
        key: "range_low",
        title: "Range Low",
        children: [
          constructNode("confirmations", "Confirmations", {
            isConfirmation: true,
            children: [
              constructNode("reclaim", "Reclaim", {
                icon: Lock,
                isConfirmation: true,
              }),
              constructNode("bos_break", "Bos Break", {
                icon: Zap,
                isConfirmation: true,
                children: createTimeframeNodes({
                  availableTimeframes,
                  prefix: "bos_break",
                }).map(treeNodeToConfig),
              }),
            ],
          }),
        ],
      },
    ]),
  }),
  constructNode("inducement", "Inducement"),
  {
    ...constructNode("fixed_range_confluence", "Fixed Range Confluence", {
      children: createFixedRangeConfluenceChildren(),
    }),
  },
];

/**
 * Supply Range with timeframes
 */
export const createSupplyRangeWithTimeframes = (
  availableTimeframes: string[] = []
) =>
  createTimeframedChildren("range", availableTimeframes, () =>
    createSupplyRangeChildren(availableTimeframes)
  );
