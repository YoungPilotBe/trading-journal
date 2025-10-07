import type { TreeNodeConfig } from "../tree.utils.new";
import {
  constructNode,
  createTimeframedChildren,
} from "../utils/node-creators";

/**
 * FVG children
 */
export const createFVGChildren = (): TreeNodeConfig[] => [
  constructNode("child1", "child"),
  constructNode("child2", "child"),
];

/**
 * FVG node creator
 */
export const createFVG = (availableTimeframes: string[]): TreeNodeConfig[] => [
  constructNode("fvg", "FVG", {
    isAddable: true,
    addButtonLabel: "Add FVG",
    addablePrefix: (originalKey: string, instanceNumber: number) =>
      `${originalKey}_#${instanceNumber}`,
    children: createTimeframedChildren("fvg", availableTimeframes, () =>
      createFVGChildren()
    ),
  }),
];
