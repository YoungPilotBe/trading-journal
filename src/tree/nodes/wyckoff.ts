import type { TreeNodeConfig } from "../tree.utils.new";
import {
  constructAntiBranch,
  createTimeframedChildren,
} from "../utils/node-creators";

/**
 * Wyckoff model nodes
 */
export const createWyckoffChildren = (): TreeNodeConfig[] =>
  constructAntiBranch([
    { key: "model_1", title: "Model 1" },
    { key: "model_2", title: "Model 2" },
  ]);

/**
 * Wyckoff with timeframes
 */
export const createWyckoffWithTimeframes = (
  availableTimeframes: string[] = []
) =>
  createTimeframedChildren("wyckoff", availableTimeframes, () =>
    createWyckoffChildren()
  );
