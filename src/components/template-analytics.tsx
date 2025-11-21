import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTemplateTradeSetupCount } from "@/hooks/analytics/use-template-trade-setup-count";
import { useTemplateWinLossRatio } from "@/hooks/analytics/use-template-win-loss-ratio";
import { formatRMultiple } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { Doc, Id } from "convex/_generated/dataModel";
import { LinkIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

type TemplateAnalyticsProps = {
  templateId: Id<"trade_templates"> | undefined;
  existingTemplate?: Doc<"trade_templates"> | null;
  onDelete?: () => void;
};

export const TemplateAnalytics = ({
  templateId,
  existingTemplate,
  onDelete,
}: TemplateAnalyticsProps) => {
  const navigate = useNavigate();
  const [rMultipleFilter, setRMultipleFilter] = useState<"all" | "closed">(
    "all"
  );
  const { data: countData, isLoading: isLoadingCount } =
    useTemplateTradeSetupCount(templateId);
  const { data: ratioData, isLoading: isLoadingRatio } =
    useTemplateWinLossRatio(templateId);

  if (!templateId) {
    return null;
  }

  const isLoading = isLoadingCount || isLoadingRatio;
  const tradeSetupCount = countData?.tradeSetupCount ?? 0;
  const winCount = ratioData?.winCount ?? 0;
  const lossCount = ratioData?.lossCount ?? 0;
  const totalResults = winCount + lossCount;
  const avgRMultiple =
    rMultipleFilter === "all"
      ? ratioData?.avgRMultipleAll
      : ratioData?.avgRMultipleClosed;
  const hasRMultiple = avgRMultiple !== null && avgRMultiple !== undefined;

  // Prepare pie chart data
  const pieData = [
    { name: "Win", value: winCount, color: "#34d399" }, // emerald-400
    { name: "Loss", value: lossCount, color: "#a3a3a3" }, // muted white/gray
  ].filter((item) => item.value > 0); // Only show segments with data

  // Calculate win/loss ratio (win divided by loss)
  const winLossRatio =
    lossCount > 0
      ? (winCount / lossCount).toFixed(1)
      : winCount > 0
        ? "∞"
        : "0.0";

  const handleLinkClick = () => {
    navigate({
      to: "/dashboard/setups",
    });
  };

  return (
    <div className="inline-flex flex-row gap-2 items-center h-8">
      {/* Trade Setup Count Link */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLinkClick}
            className="h-8 px-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Skeleton className="h-4 w-8" />
            ) : (
              <>
                <LinkIcon className="w-4 h-4 mr-1" />
                <span className="text-xs">{tradeSetupCount}</span>
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {tradeSetupCount === 1
              ? "1 trade setup uses this template"
              : `${tradeSetupCount} trade setups use this template`}
          </p>
        </TooltipContent>
      </Tooltip>

      {/* Win/Loss Pie Chart */}
      {isLoading ? (
        <Skeleton className="h-8 w-8 rounded-full" />
      ) : totalResults > 0 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-xs text-muted-foreground whitespace-nowrap hover:bg-accent/70 transition py-1.5 px-3 flex flex-row gap-2 items-center h-8 rounded-md">
              <span className="text-emerald-400">{winLossRatio}</span>
              <PieChart width={28} height={28}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={8}
                  outerRadius={13}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  cornerRadius={1}
                  paddingAngle={8}
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="text-xs">
                <span className="text-emerald-400">Win:</span> {winCount}
              </p>
              <p className="text-xs">
                <span className="text-muted-foreground">Loss:</span> {lossCount}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      ) : null}

      {/* R-Multiple Display */}
      {isLoading ? (
        <Skeleton className="h-8 w-16" />
      ) : hasRMultiple ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() =>
                setRMultipleFilter(rMultipleFilter === "all" ? "closed" : "all")
              }
              className={clsx(
                "text-xs font-mono px-2 py-1 rounded transition-colors h-8 flex items-center gap-1 hover:bg-accent/70",
                avgRMultiple! >= 1 ? "text-emerald-500" : "text-rose-500"
              )}
            >
              <span>{formatRMultiple(avgRMultiple!, { decimals: 1 })}R</span>
              <span className="text-muted-foreground text-[10px]">
                {rMultipleFilter === "all" ? "A" : "C"}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="text-xs">
                Average R-Multiple (
                {rMultipleFilter === "all" ? "all trades" : "closed trades"})
              </p>
              <p className="text-xs text-muted-foreground">
                Click to toggle filter
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      ) : null}

      {/* Vertical Separator */}
      {(existingTemplate || onDelete) && (
        <Separator orientation="vertical" className="h-6" />
      )}

      {/* Delete Button */}
      {existingTemplate && onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onDelete}
              variant="ghost"
              size="sm"
              className="h-8 px-2"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete template</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
