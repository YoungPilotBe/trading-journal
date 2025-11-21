import { useChart } from "@/hooks/use-chart";
import {
  ChartProps,
  ChartProvider,
  ChartType,
  type EmotionChartColors,
  type EmotionChartData,
  type EvolutionChartColors,
  type EvolutionChartData,
  type TemplateChartColors,
  type TemplateChartData,
} from "./chart-context";
import { EmotionChart } from "./emotion-chart";
import { EvolutionLineChart } from "./evolution-line-chart";
import { TemplateView } from "./template-view";

type Props<T extends ChartType = ChartType> = {
  chartType: T;
  props?: ChartProps<T>;
};

const Chart = <T extends ChartType>({ chartType, props }: Props<T>) => {
  return (
    <ChartProvider chartType={chartType} props={props}>
      <ChartContent chartType={chartType} props={props} />
    </ChartProvider>
  );
};

// Internal component that uses the chart context
const ChartContent = <T extends ChartType>({
  chartType,
  props,
}: {
  chartType: ChartType;
  props?: ChartProps<T>;
}) => {
  const { data, chartConfig, chartColors, isLoading, error } = useChart();

  // Handle error state
  if (error) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-destructive">
        <p>Error loading chart data</p>
      </div>
    );
  }

  // Render appropriate chart component based on chartType prop
  // Each component will handle bar/pie rendering internally based on chartConfig.type
  if (chartType === "emotion") {
    return (
      <EmotionChart
        data={data as EmotionChartData[] | null}
        chartConfig={chartConfig}
        chartColors={chartColors as EmotionChartColors | null}
        isLoading={isLoading}
      />
    );
  }

  if (chartType === "r-multiple") {
    const templateId =
      (props as ChartProps<"r-multiple">)?.templateId ?? undefined;
    const filterType = (props as ChartProps<"r-multiple">)?.filterType ?? "all";
    return (
      <TemplateView
        data={data as TemplateChartData[] | null}
        chartConfig={chartConfig}
        chartColors={chartColors as TemplateChartColors | null}
        isLoading={isLoading}
        templateId={templateId}
        filterType={filterType}
      />
    );
  }

  if (chartType === "r-multiple-evolution") {
    const tradeSetupId =
      (props as ChartProps<"r-multiple-evolution">)?.tradeSetupId ?? undefined;
    return (
      <EvolutionLineChart
        data={data as EvolutionChartData[] | null}
        chartConfig={chartConfig}
        chartColors={chartColors as EvolutionChartColors | null}
        isLoading={isLoading}
        tradeSetupId={tradeSetupId}
      />
    );
  }

  // Fallback for unknown chart type
  return (
    <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground">
      <p>Unknown chart type</p>
    </div>
  );
};

export default Chart;
