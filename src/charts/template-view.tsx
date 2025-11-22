import type { Id } from "convex/_generated/dataModel";
import type {
  BaseChartConfig,
  TemplateChartColors,
  TemplateChartData,
} from "./chart.types";
import { TemplateChart } from "./template-chart";
import { TemplateList } from "./template-list";

type TemplateViewProps = {
  data: TemplateChartData[] | null;
  chartConfig: BaseChartConfig | null;
  chartColors: TemplateChartColors | null;
  isLoading?: boolean;
  templateId?: Id<"trade_templates">;
  filterType?: "all" | "closed";
  templateView?: "list" | "chart";
};

export const TemplateView = ({
  data,
  chartConfig,
  chartColors,
  isLoading = false,
  templateId,
  filterType = "all",
  templateView = "list",
}: TemplateViewProps) => {
  return (
    <div className="w-full">
      {/* Render appropriate view */}
      {templateView === "chart" ? (
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
