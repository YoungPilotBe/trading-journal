import {
  CheckCircle,
  DollarSign,
  LogIn,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { TreeNode } from "../tree.utils";

export const executedStrategyTree: TreeNode[] = [
  {
    key: "executed_entry",
    title: "Entry",
    icon: LogIn,
    iconClassName: "",
    children: [
      {
        key: "executed_entry_type",
        title: "Entry Type",
        children: [
          {
            key: "executed_market_entry",
            title: "Market",
            anti: ["executed_limit_entry"],
          },
          {
            key: "executed_limit_entry",
            title: "Limit",
            anti: ["executed_market_entry"],
          },
        ],
      },
      {
        key: "executed_fill_quality",
        title: "Fill Quality",
        icon: CheckCircle,
        iconClassName: "",
        children: [
          {
            key: "executed_good_fill",
            title: "Good",
            icon: TrendingUp,
            iconClassName: "text-emerald-500",
            anti: ["executed_poor_fill"],
          },
          {
            key: "executed_poor_fill",
            title: "Poor",
            icon: TrendingDown,
            iconClassName: "text-rose-500",
            anti: ["executed_good_fill"],
          },
        ],
      },
    ],
  },
  {
    key: "executed_management",
    title: "Management",
    children: [
      {
        key: "executed_stop_loss",
        title: "Stop Loss",
        icon: Shield,
        iconClassName: "",
      },
      {
        key: "executed_take_profit",
        title: "Take Profit",
        icon: Target,
        iconClassName: "",
      },
      {
        key: "executed_position_size",
        title: "Position Size",
        icon: DollarSign,
        iconClassName: "",
      },
    ],
  },
];
