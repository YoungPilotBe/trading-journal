import {
  BarChart3,
  CheckCircle,
  DollarSign,
  LogOut,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { TreeNode } from "../tree.utils";

export const closedStrategyTree: TreeNode[] = [
  {
    key: "closed_exit",
    title: "Exit",
    icon: LogOut,
    iconClassName: "",
    children: [
      {
        key: "closed_exit_reason",
        title: "Exit Reason",
        children: [
          {
            key: "closed_target_hit",
            title: "Target Hit",
            icon: Target,
            iconClassName: "text-emerald-500",
            anti: ["closed_stop_hit", "closed_manual_exit"],
          },
          {
            key: "closed_stop_hit",
            title: "Stop Hit",
            icon: XCircle,
            iconClassName: "text-rose-500",
            anti: ["closed_target_hit", "closed_manual_exit"],
          },
          {
            key: "closed_manual_exit",
            title: "Manual Exit",
            anti: ["closed_target_hit", "closed_stop_hit"],
          },
        ],
      },
      {
        key: "closed_execution_quality",
        title: "Execution Quality",
        icon: CheckCircle,
        iconClassName: "",
        children: [
          {
            key: "closed_good_execution",
            title: "Good",
            icon: TrendingUp,
            iconClassName: "text-emerald-500",
            anti: ["closed_poor_execution"],
          },
          {
            key: "closed_poor_execution",
            title: "Poor",
            icon: TrendingDown,
            iconClassName: "text-rose-500",
            anti: ["closed_good_execution"],
          },
        ],
      },
    ],
  },
  {
    key: "closed_performance",
    title: "Performance",
    children: [
      {
        key: "closed_pnl",
        title: "P&L",
        icon: DollarSign,
        iconClassName: "",
        children: [
          {
            key: "closed_profit",
            title: "Profit",
            icon: TrendingUp,
            iconClassName: "text-emerald-500",
            anti: ["closed_loss"],
          },
          {
            key: "closed_loss",
            title: "Loss",
            icon: TrendingDown,
            iconClassName: "text-rose-500",
            anti: ["closed_profit"],
          },
        ],
      },
      {
        key: "closed_risk_reward",
        title: "Risk/Reward",
        icon: BarChart3,
        iconClassName: "",
      },
    ],
  },
];
