import { ChevronDown, ChevronUp, ChevronsDown, ChevronsUp } from "lucide-react";
import type { TreeNodeConfig } from "../tree.utils.new";
import { constructAntiBranch } from "../utils/node-creators";

/**
 * Premium/Discount pricing nodes
 */
export const createDiscountPremiumPricing = (): TreeNodeConfig[] =>
  constructAntiBranch([
    {
      key: "extreme_premium",
      title: "Extreme Premium",
      metadata: { icon: ChevronsUp },
    },
    { key: "premium", title: "Premium", metadata: { icon: ChevronUp } },
    { key: "discount", title: "Discount", metadata: { icon: ChevronDown } },
    {
      key: "extreme_discount",
      title: "Extreme Discount",
      metadata: { icon: ChevronsDown },
    },
  ]);
