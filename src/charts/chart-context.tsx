/* eslint-disable react-refresh/only-export-components */
import { useEmotionChart } from "@/hooks/charts/use-emotion-chart";
import { useRiskRewardChart } from "@/hooks/charts/use-risk-reward-chart";
import React, { createContext } from "react";

// Chart type definition
export type ChartType = "emotion" | "risk-reward";

// Chart context value type
export interface ChartContextValue {
  data: unknown;
  chartConfig: unknown;
  chartColors: unknown;
  isLoading: boolean;
  error: unknown;
}

// Create context
const ChartContext = createContext<ChartContextValue | undefined>(undefined);

// Provider component props
interface ChartProviderProps {
  children: React.ReactNode;
  chartType: ChartType;
}

// Provider component
export function ChartProvider({ children, chartType }: ChartProviderProps) {
  // Call all hooks unconditionally (React hooks rule)
  // Pass enabled=false to prevent unnecessary fetching
  // Only the selected chart type will actually fetch data
  const emotionData = useEmotionChart(chartType === "emotion");
  const riskRewardData = useRiskRewardChart(chartType === "risk-reward");

  // Select the appropriate data based on chartType
  let chartData: {
    data: unknown;
    chartConfig: unknown;
    chartColors: unknown;
    isLoading: boolean;
    error: unknown;
  };

  switch (chartType) {
    case "emotion":
      chartData = emotionData;
      break;
    case "risk-reward":
      chartData = riskRewardData;
      break;
    default:
      // TypeScript should prevent this, but adding for safety
      throw new Error(`Unknown chart type: ${chartType satisfies never}`);
  }

  const value: ChartContextValue = {
    data: chartData.data,
    chartConfig: chartData.chartConfig,
    chartColors: chartData.chartColors,
    isLoading: chartData.isLoading ?? false,
    error: chartData.error ?? null,
  };

  return (
    <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
  );
}

// Export context for use in hook
export { ChartContext };
