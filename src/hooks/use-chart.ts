import { ChartContext, ChartContextValue } from "@/charts/chart-context";
import { useContext } from "react";

/**
 * Hook to access chart context
 *
 * Provides access to chart data, configuration, and colors from the ChartProvider.
 * The data, config, and colors are automatically fetched based on the chartType
 * specified in the ChartProvider.
 *
 * @returns {ChartContextValue} Object containing:
 *   - `data`: The chart data fetched from the database (type depends on chartType)
 *   - `chartConfig`: Configuration object for the chart (type depends on chartType)
 *   - `chartColors`: Color scheme configuration for the chart (type depends on chartType)
 *
 * @throws {Error} If used outside of ChartProvider
 *
 * @example
 * ```tsx
 * function MyChartComponent() {
 *   const { data, chartConfig, chartColors } = useChart();
 *   // Use data, chartConfig, and chartColors to render the chart
 *   return <div>Chart content</div>;
 * }
 * ```
 */
export function useChart(): ChartContextValue {
  const context = useContext(ChartContext);
  if (context === undefined) {
    throw new Error("useChart must be used within a ChartProvider");
  }
  return context;
}
