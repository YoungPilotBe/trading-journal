import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRiskReward } from "@/lib/utils";
import { Route } from "@/routes/(app)/dashboard/setup/route";
import { Link, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import type { Id } from "convex/_generated/dataModel";
import { CheckCircle2, ChevronRight, List } from "lucide-react";
import type {
  BaseChartConfig,
  TemplateChartColors,
  TemplateChartData,
} from "./chart.types";

type TemplateChartProps = {
  data: TemplateChartData[] | null;
  chartConfig: BaseChartConfig | null;
  chartColors: TemplateChartColors | null;
  isLoading?: boolean;
  templateId?: Id<"trade_templates">;
  filterType?: "all" | "closed";
};

export const TemplateChart = ({
  data,
  chartConfig,
  chartColors,
  isLoading = false,
  templateId,
  filterType = "all",
}: TemplateChartProps) => {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();

  const handleFilterChange = (newFilterType: "all" | "closed") => {
    navigate({
      search: {
        ...search,
        templateFilter: newFilterType,
      },
    });
  };
  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-muted-foreground font-mono py-8">
        <p>No template data available</p>
      </div>
    );
  }

  if (!chartColors || !chartConfig) {
    return (
      <div className="w-full flex items-center justify-center text-muted-foreground font-mono py-8">
        <p>Chart configuration missing</p>
      </div>
    );
  }

  // Sort templates by avgRiskReward descending
  const sortedData = [...data].sort(
    (a, b) => b.avgRiskReward - a.avgRiskReward
  );

  // Calculate total count for usage percentage
  const totalCount = sortedData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="w-full space-y-4">
      {/* Filter buttons */}
      <ButtonGroup>
        <Button
          variant="badge"
          size="sm"
          onClick={() => handleFilterChange("all")}
          className={clsx(filterType === "closed" && "opacity-50")}
        >
          <List className="h-3 w-3 mr-1.5" />
          All Trades
        </Button>
        <Button
          variant="badge"
          size="sm"
          onClick={() => handleFilterChange("closed")}
          className={clsx(filterType === "all" && "opacity-50")}
        >
          <CheckCircle2 className="h-3 w-3 mr-1.5" />
          Closed Trades
        </Button>
      </ButtonGroup>

      <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-x-4 gap-y-3">
        {/* Header row */}
        <div></div>
        <div className="text-xs font-mono text-muted-foreground font-medium">
          Template
        </div>
        <div className="text-xs font-mono text-muted-foreground font-medium">
          Risk:Reward
        </div>
        <div className="text-xs font-mono text-muted-foreground font-medium">
          Usage
        </div>

        {/* Separator */}
        <div className="col-span-4">
          <Separator />
        </div>

        {/* Data rows */}
        {sortedData.map((item) => {
          const isHighlighted =
            templateId !== undefined &&
            String(templateId) === String(item.templateId);
          const isAboveOne = item.avgRiskReward >= 1;
          const usagePercentage =
            totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : "0";

          // Determine color classes based on state
          const textColorClass = isAboveOne
            ? "text-emerald-500"
            : "text-rose-500";

          return (
            <>
              {/* Icon indicator */}
              <div
                key={`${item.templateId}-icon`}
                className="flex items-center justify-center py-1"
              >
                {isHighlighted && (
                  <ChevronRight
                    className={clsx("h-4 w-4 text-muted-foreground")}
                  />
                )}
              </div>

              {/* Template Title (clickable) */}
              <div
                key={`${item.templateId}-title`}
                className="flex items-center py-1"
              >
                <Link
                  to="/trade_template"
                  search={{ templateId: item.templateId }}
                  className={clsx(
                    "text-sm font-mono transition-colors hover:underline font-thin",
                    isHighlighted && "font-semibold",
                    "text-foreground"
                  )}
                >
                  {item.templateTitle}
                </Link>
              </div>

              {/* Risk:Reward */}
              <div
                key={`${item.templateId}-risk`}
                className="flex items-center py-1"
              >
                <span
                  className={clsx(
                    "text-sm font-mono font-medium",
                    textColorClass
                  )}
                >
                  {formatRiskReward(item.avgRiskReward, { addPrefix: true })}R
                </span>
              </div>

              {/* Usage Percentage */}
              <div
                key={`${item.templateId}-usage`}
                className="flex items-center py-1"
              >
                <span className="text-sm font-mono text-muted-foreground">
                  {usagePercentage}%
                </span>
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
};
