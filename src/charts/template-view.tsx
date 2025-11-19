import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Route } from "@/routes/(app)/dashboard/setup/route";
import { useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import type { Id } from "convex/_generated/dataModel";
import { BarChart3, CheckCircle2, List } from "lucide-react";
import { TemplateChart } from "./template-chart";
import { TemplateList } from "./template-list";
import type {
  BaseChartConfig,
  TemplateChartColors,
  TemplateChartData,
} from "./chart.types";

type TemplateViewProps = {
  data: TemplateChartData[] | null;
  chartConfig: BaseChartConfig | null;
  chartColors: TemplateChartColors | null;
  isLoading?: boolean;
  templateId?: Id<"trade_templates">;
  filterType?: "all" | "closed";
};

export const TemplateView = ({
  data,
  chartConfig,
  chartColors,
  isLoading = false,
  templateId,
  filterType = "all",
}: TemplateViewProps) => {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const viewType = search.templateView ?? "list";

  const handleViewChange = (newViewType: "list" | "chart") => {
    navigate({
      search: {
        ...search,
        templateView: newViewType,
      },
    });
  };

  const handleFilterChange = (newFilterType: "all" | "closed") => {
    navigate({
      search: {
        ...search,
        templateFilter: newFilterType,
      },
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Filter and view toggle buttons */}
      <div className="flex justify-between items-center">
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

        {/* View toggle buttons */}
        <ButtonGroup>
          <Button
            variant="badge"
            size="sm"
            onClick={() => handleViewChange("list")}
            className={clsx(viewType === "chart" && "opacity-50")}
          >
            <List className="h-3 w-3" />
          </Button>
          <Button
            variant="badge"
            size="sm"
            onClick={() => handleViewChange("chart")}
            className={clsx(viewType === "list" && "opacity-50")}
          >
            <BarChart3 className="h-3 w-3" />
          </Button>
        </ButtonGroup>
      </div>

      {/* Render appropriate view */}
      {viewType === "chart" ? (
        <TemplateChart
          data={data}
          chartConfig={chartConfig}
          chartColors={chartColors}
          isLoading={isLoading}
          templateId={templateId}
          filterType={filterType}
        />
      ) : (
        <TemplateList
          data={data}
          chartConfig={chartConfig}
          chartColors={chartColors}
          isLoading={isLoading}
          templateId={templateId}
          filterType={filterType}
        />
      )}
    </div>
  );
};

