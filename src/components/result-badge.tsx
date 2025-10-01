import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Doc } from "convex/_generated/dataModel";

type Props = {
  result: Doc<"trade_setups">["result"];
  className?: string;
} & VariantProps<typeof resultBadgeVariants>;

const resultBadgeVariants = cva(
  "border font-mono transition-all inline-flex items-center",
  {
    variants: {
      result: {
        win: "border-emerald-400/70 bg-emerald-500/5 text-emerald-300/80",
        loss: "border-red-400/70 bg-red-500/5 text-red-300/80",
        breakeven: "border-yellow-400/70 bg-yellow-500/5 text-yellow-300/80",
      },
      size: {
        small: "px-1.5 py-0.5 text-[11px] leading-none scale-90",
        normal: "px-2 py-0.5 text-xs rounded-sm",
      },
    },
    defaultVariants: {
      size: "normal",
    },
  }
);

const resultLabels = {
  win: "Win",
  loss: "Loss",
  breakeven: "Breakeven",
} as const;

const ResultBadge = ({ result, size, className }: Props) => {
  if (!result) return null;

  return (
    <span className={cn(resultBadgeVariants({ result, size }), className)}>
      {resultLabels[result]}
    </span>
  );
};

export default ResultBadge;
