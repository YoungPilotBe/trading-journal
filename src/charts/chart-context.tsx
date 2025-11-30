/* eslint-disable react-refresh/only-export-components */
import { useEmotionChart } from "@/hooks/charts/use-emotion-chart";
import { useProgressionChart } from "@/hooks/charts/use-progression-chart";
import { useRMultipleChart } from "@/hooks/charts/use-r-multiple-chart";
import { useRMultipleEvolution } from "@/hooks/charts/use-r-multiple-evolution";
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
  ProgressionChartData,
  ProgressionSnapshotResult,
  TemplateChartColors,
  TemplateChartData,
} from "./chart.types";
import type { Id } from "../../convex/_generated/dataModel";

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
  const rMultipleData = useRMultipleChart(
    chartType === "r-multiple",
    chartType === "r-multiple"
      ? ((props as ChartProps<"r-multiple">)?.filterType ?? "all")
      : "all"
  );
  const evolutionData = useRMultipleEvolution(
    chartType === "r-multiple-evolution"
      ? ((props as ChartProps<"r-multiple-evolution">)?.tradeSetupId ?? null)
      : null,
    chartType === "r-multiple-evolution"
  );
  const progressionData = useProgressionChart(
    chartType === "progression"
      ? ((props as ChartProps<"progression">)?.tradeSetupId ?? null)
      : null,
    chartType === "progression"
      ? ((props as ChartProps<"progression">)?.snapshotId ?? null)
      : null,
    chartType === "progression"
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
    case "r-multiple": {
      value = {
        data: rMultipleData.data as TemplateChartData[] | null,
        chartConfig: rMultipleData.chartConfig as BaseChartConfig | null,
        chartColors: rMultipleData.chartColors as TemplateChartColors | null,
        isLoading: rMultipleData.isLoading,
        error: rMultipleData.error ?? null,
      } as ChartContextValue<"r-multiple">;
      break;
    }
    case "r-multiple-evolution": {
      value = {
        data: evolutionData.data as EvolutionChartData[] | null,
        chartConfig: evolutionData.chartConfig as BaseChartConfig | null,
        chartColors: evolutionData.chartColors as EvolutionChartColors | null,
        isLoading: evolutionData.isLoading,
        error: evolutionData.error ?? null,
      } as ChartContextValue<"r-multiple-evolution">;
      break;
    }
    case "progression": {
      value = {
        data: progressionData.data as ProgressionChartData[] | null,
        chartConfig: progressionData.chartConfig as BaseChartConfig | null,
        chartColors: progressionData.chartColors as EvolutionChartColors | null,
        isLoading: progressionData.isLoading,
        error: progressionData.error ?? null,
        snapshots: progressionData.snapshots as ProgressionSnapshotResult[] | null,
        currentSnapshotId: progressionData.currentSnapshotId as Id<"snapshots"> | null | undefined,
      } as ChartContextValue<"progression">;
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
  ProgressionChartColors,
  ProgressionChartData,
  TemplateChartColors,
  TemplateChartData,
} from "./chart.types";

// Re-export type guards
export { isEmotionChartResponse, isTemplateChartResponse } from "./chart.types";
