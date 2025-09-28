import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { TreeNode } from "../tree.utils";

export const reviewedStrategyTree: TreeNode[] = [
  {
    key: "reviewed_analysis",
    title: "Analysis",
    icon: BookOpen,
    iconClassName: "",
    children: [
      {
        key: "reviewed_setup_quality",
        title: "Setup Quality",
        icon: BarChart3,
        iconClassName: "",
        children: [
          {
            key: "reviewed_good_setup",
            title: "Good Setup",
            icon: CheckCircle,
            iconClassName: "text-emerald-500",
            anti: ["reviewed_poor_setup"],
          },
          {
            key: "reviewed_poor_setup",
            title: "Poor Setup",
            icon: XCircle,
            iconClassName: "text-rose-500",
            anti: ["reviewed_good_setup"],
          },
        ],
      },
      {
        key: "reviewed_execution_review",
        title: "Execution Review",
        icon: Target,
        iconClassName: "",
        children: [
          {
            key: "reviewed_good_execution",
            title: "Good Execution",
            icon: TrendingUp,
            iconClassName: "text-emerald-500",
            anti: ["reviewed_poor_execution"],
          },
          {
            key: "reviewed_poor_execution",
            title: "Poor Execution",
            icon: TrendingDown,
            iconClassName: "text-rose-500",
            anti: ["reviewed_good_execution"],
          },
        ],
      },
    ],
  },
  {
    key: "reviewed_lessons",
    title: "Lessons",
    children: [
      {
        key: "reviewed_what_worked",
        title: "What Worked",
        icon: Lightbulb,
        iconClassName: "text-emerald-500",
      },
      {
        key: "reviewed_improvements",
        title: "Improvements",
        icon: Activity,
        iconClassName: "text-amber-500",
      },
      {
        key: "reviewed_mistakes",
        title: "Mistakes",
        icon: XCircle,
        iconClassName: "text-rose-500",
      },
    ],
  },
];
