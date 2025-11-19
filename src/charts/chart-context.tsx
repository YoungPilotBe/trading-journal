/* eslint-disable react-refresh/only-export-components */
import { useEmotionChart } from "@/hooks/charts/use-emotion-chart";
import { useRiskRewardChart } from "@/hooks/charts/use-risk-reward-chart";
import { useRiskRewardEvolution } from "@/hooks/charts/use-risk-reward-evolution";
import React, { createContext } from "react";
import type {
  BaseChartConfig,
  ChartContextValue,
  ChartProps,
  ChartType,
  EmotionChartColors,
  EmotionChartData,
  EvolutionChartColors,
  EvolutionChartData,
  TemplateChartColors,
  TemplateChartData,
} from "./chart.types";

// Create context with union type for all possible chart types
const ChartContext = createContext<ChartContextValue<ChartType> | undefined>(
  undefined
);

// Provider component props
interface ChartProviderProps<T extends ChartType = ChartType> {
  children: React.ReactNode;
  chartType: T;
  props?: ChartProps<T>;
}

// Provider component
export function ChartProvider<T extends ChartType>({
  children,
  chartType,
  props,
}: ChartProviderProps<T>) {
  // Call all hooks unconditionally (React hooks rule)
  // Pass enabled=false to prevent unnecessary fetching
  // Only the selected chart type will actually fetch data
  const emotionData = useEmotionChart(chartType === "emotion");
  const riskRewardData = useRiskRewardChart(chartType === "risk-reward");
  const evolutionData = useRiskRewardEvolution(
    chartType === "risk-reward-evolution"
      ? ((props as ChartProps<"risk-reward-evolution">)?.tradeSetupId ?? null)
      : null,
    chartType === "risk-reward-evolution"
  );

  // Select the appropriate data based on chartType
  // Type assertions are safe here because we know the hook return types match the chart type
  let value: ChartContextValue<ChartType>;

  switch (chartType) {
    case "emotion": {
      value = {
        data: emotionData.data as EmotionChartData[] | null,
        chartConfig: emotionData.chartConfig as BaseChartConfig | null,
        chartColors: emotionData.chartColors as EmotionChartColors | null,
        isLoading: emotionData.isLoading,
        error: emotionData.error ?? null,
      } as ChartContextValue<"emotion">;
      break;
    }
    case "risk-reward": {
      value = {
        data: riskRewardData.data as TemplateChartData[] | null,
        chartConfig: riskRewardData.chartConfig as BaseChartConfig | null,
        chartColors: riskRewardData.chartColors as TemplateChartColors | null,
        isLoading: riskRewardData.isLoading,
        error: riskRewardData.error ?? null,
      } as ChartContextValue<"risk-reward">;
      break;
    }
    case "risk-reward-evolution": {
      value = {
        data: evolutionData.data as EvolutionChartData[] | null,
        chartConfig: evolutionData.chartConfig as BaseChartConfig | null,
        chartColors: evolutionData.chartColors as EvolutionChartColors | null,
        isLoading: evolutionData.isLoading,
        error: evolutionData.error ?? null,
      } as ChartContextValue<"risk-reward-evolution">;
      break;
    }
    default:
      // TypeScript should prevent this, but adding for safety
      throw new Error(`Unknown chart type: ${chartType satisfies never}`);
  }

  return (
    <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
  );
}

// Export context for use in hook
export { ChartContext };

// Re-export types for convenience
export type {
  BarChartConfig,
  BaseChartConfig,
  ChartContextValue,
  ChartProps,
  ChartType,
  EmotionChartColors,
  EmotionChartData,
  EvolutionChartColors,
  EvolutionChartData,
  LineChartConfig,
  PieChartConfig,
  TemplateChartColors,
  TemplateChartData,
} from "./chart.types";

// Re-export type guards
export { isEmotionChartResponse, isTemplateChartResponse } from "./chart.types";
