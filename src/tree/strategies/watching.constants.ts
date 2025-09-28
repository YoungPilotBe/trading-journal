import {
  Activity,
  BarChart3,
  Eye,
  LogIn,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { TreeNode } from "../tree.utils";

export const watchingStrategyTree: TreeNode[] = [
  {
    key: "watching_setup",
    title: "Setup",
    icon: Eye,
    iconClassName: "",
    children: [
      {
        key: "watching_confirmation",
        title: "Confirmation",
        icon: BarChart3,
        iconClassName: "",
        children: [
          {
            key: "watching_bullish_confirmation",
            title: "Bullish",
            anti: ["watching_bearish_confirmation"],
          },
          {
            key: "watching_bearish_confirmation",
            title: "Bearish",
            anti: ["watching_bullish_confirmation"],
          },
        ],
      },
      {
        key: "watching_momentum",
        title: "Momentum",
        icon: Activity,
        iconClassName: "",
        children: [
          {
            key: "watching_strong_momentum",
            title: "Strong",
            icon: TrendingUp,
            iconClassName: "text-emerald-500",
            anti: ["watching_weak_momentum"],
          },
          {
            key: "watching_weak_momentum",
            title: "Weak",
            icon: TrendingDown,
            iconClassName: "text-rose-500",
            anti: ["watching_strong_momentum"],
          },
        ],
      },
    ],
  },
  {
    key: "watching_levels",
    title: "Key Levels",
    children: [
      {
        key: "watching_entry_level",
        title: "Entry Level",
        icon: LogIn,
        iconClassName: "",
      },
      {
        key: "watching_stop_level",
        title: "Stop Level",
        icon: Target,
        iconClassName: "",
      },
    ],
  },
];
