import { useChart } from "@/hooks/use-chart";
import { ChartProvider, ChartType } from "./chart-context";
import { EmotionBarChart } from "./emotion-bar-chart";
import { TemplatePieChart } from "./template-pie-chart";

type Props = {
  chartType: ChartType;
};

const Chart = ({ chartType }: Props) => {
  return (
    <ChartProvider chartType={chartType}>
      <ChartContent />
    </ChartProvider>
  );
};

// Internal component that uses the chart context
const ChartContent = () => {
  const { data, chartConfig, chartColors, isLoading, error } = useChart();

  // Handle error state
  if (error) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-destructive">
        <p>Error loading chart data</p>
      </div>
    );
  }

  // Determine chart type from config
  const chartTypeFromConfig =
    chartConfig && typeof chartConfig === "object" && "type" in chartConfig
      ? (chartConfig as { type: string }).type
      : null;

  // Render appropriate chart based on config type
  if (chartTypeFromConfig === "bar") {
    return (
      <EmotionBarChart
        data={
          data as Array<{
            emotion: string;
            avgRiskReward: number;
            count: number;
          }> | null
        }
        chartConfig={
          chartConfig as { type: string; xAxis: string; yAxis: string } | null
        }
        chartColors={
          chartColors as { primary: string; secondary: string } | null
        }
        isLoading={isLoading}
      />
    );
  }

  if (chartTypeFromConfig === "pie") {
    return (
      <TemplatePieChart
        data={
          data as Array<{
            templateId: string;
            templateTitle: string;
            avgRiskReward: number;
            count: number;
          }> | null
        }
        chartConfig={
          chartConfig as { type: string; xAxis: string; yAxis: string } | null
        }
        chartColors={
          chartColors as {
            primary: string;
            secondary: string;
            colors: string[];
          } | null
        }
        isLoading={isLoading}
      />
    );
  }

  // Fallback for unknown chart type or missing config
  return (
    <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground">
      <p>Unknown chart type</p>
    </div>
  );
};

export default Chart;
