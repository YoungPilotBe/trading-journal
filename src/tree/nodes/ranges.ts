import { DotIcon } from "lucide-react";
import type { TreeNodeConfig } from "../tree.utils.new";
import {
  constructAntiBranch,
  constructNode,
  createTimeframedChildren,
} from "../utils/node-creators";
import { createFixedRangeConfluenceChildren } from "./fixed-range";

/**
 * Demand Range children
 */
export const createDemandRangeChildren = (): TreeNodeConfig[] => [
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
    createDemandRangeChildren()
  );

/**
 * Supply Range children
 */
export const createSupplyRangeChildren = (): TreeNodeConfig[] => [
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
        key: "range_low",
        title: "Range Low",
        children: [
          constructNode("confirmations", "Confirmations", {
            isConfirmation: true,
            children: [
              constructNode("midpoint", "Midpoint", {
                icon: DotIcon,
                isConfirmation: true,
              }),
            ],
          }),
        ],
      },
      {
        key: "range_high",
        title: "Range High",
        children: [
          constructNode("confirmations", "Confirmations", {
            isConfirmation: true,
            children: [
              constructNode("midpoint", "Midpoint", {
                icon: DotIcon,
                isConfirmation: true,
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
    createSupplyRangeChildren()
  );
