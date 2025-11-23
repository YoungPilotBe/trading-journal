import StatusOption from "@/components/status-option";
import { Skeleton } from "@/components/ui/skeleton";
import { useActualRMultipleEvolution } from "@/hooks/charts/use-actual-r-multiple-evolution";
import type { Doc, Id } from "convex/_generated/dataModel";
import {
  Area,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  BaseChartConfig,
  EvolutionChartColors,
  EvolutionChartData,
} from "./chart.types";

type EvolutionLineChartProps = {
  data: EvolutionChartData[] | null;
  chartConfig: BaseChartConfig | null;
  chartColors: EvolutionChartColors | null;
  isLoading?: boolean;
  tradeSetupId?: Id<"trade_setups">;
};

export const EvolutionLineChart = ({
  data,
  chartConfig,
  chartColors,
  isLoading = false,
  tradeSetupId,
}: EvolutionLineChartProps) => {
  // Fetch actual R-multiple data if tradeSetupId is provided
  const { data: actualData, isLoading: isActualLoading } =
    useActualRMultipleEvolution(tradeSetupId ?? null, !!tradeSetupId);

  if (isLoading || isActualLoading) {
    return (
      <div className="w-full h-[400px] space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground font-mono">
        <p>No snapshot data available</p>
      </div>
    );
  }

  if (!chartColors || !chartConfig) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground font-mono">
        <p>Chart configuration missing</p>
      </div>
    );
  }

  // Format R-Multiple to 2 decimal places
  const formatRMultiple = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    return value.toFixed(2);
  };

  // Merge actual R-multiple data with main data by snapshotId
  const actualDataMap = new Map(
    (actualData || []).map((item) => [item.snapshotId, item.rMultiple])
  );

  // Combine both datasets - store original null values for tooltip and min/max calculation
  const chartData = data.map((item) => {
    const actualRMultipleValue = actualDataMap.get(item.snapshotId) ?? null;
    return {
      ...item,
      rMultiple: item.rMultiple ?? 0, // Use 0 for null values so line can render
      actualRMultiple: actualRMultipleValue ?? 0, // Use 0 for null values so line can render
      actualRMultipleOriginal: actualRMultipleValue, // Keep original for tooltip and calculations
    };
  });

  // Calculate min and max R-Multiple values for gradient positioning (include both datasets)
  // Use original values (not the 0 placeholders) for accurate min/max
  const allRMultipleValues = [
    ...data
      .map((item) => item.rMultiple)
      .filter((val) => val !== null && val !== undefined),
    ...(actualData || [])
      .map((item) => item.rMultiple)
      .filter((val) => val !== null && val !== undefined),
  ] as number[];

  const minValue =
    allRMultipleValues.length > 0 ? Math.min(...allRMultipleValues, 0) : 0;
  const maxValue =
    allRMultipleValues.length > 0 ? Math.max(...allRMultipleValues, 1) : 1;

  // Ensure domain includes 1 for proper gradient alignment
  const yDomainMin = Math.min(minValue, 0);
  const yDomainMax = Math.max(maxValue, 1);
  const range = yDomainMax - yDomainMin || 1; // Avoid division by zero

  // Colors
  const roseRed = "oklch(0.65 0.18 15)"; // soft rose red
  const neutralWhite = "oklch(0.96 0.01 106.423)"; // more muted neutral white
  const emeraldGreen = "oklch(0.696 0.17 162.48)"; // emerald green (chart-2)

  // Chart dimensions (accounting for margins)
  const chartHeight = 400;
  const marginTop = 50;
  const marginBottom = 60;
  const chartAreaHeight = chartHeight - marginTop - marginBottom;

  // Calculate the y-position of y=1 in chart coordinates
  // Chart coordinates: top of chart area = marginTop, bottom = chartHeight - marginBottom
  // We need to map y=1 from data domain to chart pixel coordinates
  const y1PixelPosition =
    marginTop + (chartAreaHeight * (yDomainMax - 1)) / range;

  return (
    <div className="w-full h-[400px] outline-none">
      <ResponsiveContainer width="100%" height="100%" className="outline-none">
        <LineChart
          data={chartData}
          margin={{ top: marginTop, right: 60, left: 60, bottom: marginBottom }}
        >
          <defs>
            <linearGradient
              id="rMultipleGradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={marginTop}
              x2="0"
              y2={chartHeight - marginBottom}
            >
              {/* Top of chart (maxValue) = white for values above 1 */}
              <stop offset="0%" stopColor={neutralWhite} stopOpacity={1} />
              {/* At y=1 transition point - calculate offset based on pixel position */}
              <stop
                offset={`${((y1PixelPosition - marginTop) / chartAreaHeight) * 100}%`}
                stopColor={neutralWhite}
                stopOpacity={1}
              />
              <stop
                offset={`${((y1PixelPosition - marginTop) / chartAreaHeight) * 100}%`}
                stopColor={roseRed}
                stopOpacity={1}
              />
              {/* Bottom of chart (minValue) = rose red for values below 1 */}
              <stop offset="100%" stopColor={roseRed} stopOpacity={1} />
            </linearGradient>
            {/* Gradient for area fill: rose red at bottom, transparent at y=1 */}
            <linearGradient
              id="areaFillGradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={marginTop}
              x2="0"
              y2={chartHeight - marginBottom}
            >
              {/* Top (y=1): transparent */}
              <stop
                offset={`${((y1PixelPosition - marginTop) / chartAreaHeight) * 100}%`}
                stopColor={roseRed}
                stopOpacity={0}
              />
              {/* Bottom: rose red */}
              <stop offset="100%" stopColor={roseRed} stopOpacity={0.2} />
            </linearGradient>
            {/* Gradient for actual R-Multiple line: emerald green above 1R, rose red below 1R */}
            <linearGradient
              id="actualRMultipleGradient"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1={marginTop}
              x2="0"
              y2={chartHeight - marginBottom}
            >
              {/* Top of chart (maxValue) = emerald green for values above 1 */}
              <stop offset="0%" stopColor={emeraldGreen} stopOpacity={1} />
              {/* At y=1 transition point */}
              <stop
                offset={`${((y1PixelPosition - marginTop) / chartAreaHeight) * 100}%`}
                stopColor={emeraldGreen}
                stopOpacity={1}
              />
              <stop
                offset={`${((y1PixelPosition - marginTop) / chartAreaHeight) * 100}%`}
                stopColor={roseRed}
                stopOpacity={1}
              />
              {/* Bottom of chart (minValue) = rose red for values below 1 */}
              <stop offset="100%" stopColor={roseRed} stopOpacity={1} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="index"
            type="number"
            axisLine={false}
            tickLine={false}
            hide
            domain={["dataMin", "dataMax"]}
          />
          <YAxis domain={[yDomainMin, yDomainMax]} hide />
          {/* Area fill from bottom up to y=1 with gradient */}
          <Area
            type="monotone"
            dataKey="rMultiple"
            fill="url(#areaFillGradient)"
            stroke="none"
            data={chartData.map((item) => ({
              ...item,
              // Clamp values to min(value, 1) so area only fills up to y=1
              rMultiple: Math.min(item.rMultiple ?? yDomainMin, 1),
            }))}
            connectNulls={false}
          />
          <ReferenceLine
            y={1}
            stroke="oklch(0.553 0.013 58.071)" // muted-foreground neutral color
            strokeDasharray="5 5"
            strokeWidth={1}
            label={{
              value: "+1R",
              position: "left",
              fill: "oklch(0.553 0.013 58.071)",
              fontSize: 12,
              fontFamily: "monospace",
            }}
          />
          <Line
            type="monotone"
            dataKey="rMultiple"
            stroke="url(#rMultipleGradient)"
            strokeWidth={1}
            strokeDasharray="4 4"
            dot={({ cx, cy, payload }) => {
              if (cx === undefined || cy === undefined) return null;

              const item = payload as EvolutionChartData & {
                actualRMultiple?: number | null;
              };
              const value = item.rMultiple ?? 0;
              const isAboveOne = value >= 1;
              const dotColor = isAboveOne ? neutralWhite : roseRed;

              // Position status badge above the dot
              const badgeOffsetY = -30; // Offset above the dot

              return (
                <g>
                  {/* Dot */}
                  <circle cx={cx} cy={cy} r={4} fill={dotColor} stroke="none" />
                  {/* Status badge positioned near the dot */}
                  <foreignObject
                    x={cx - 50}
                    y={cy + badgeOffsetY}
                    width={100}
                    height={30}
                  >
                    <div className="flex justify-center">
                      <StatusOption
                        value={item.status as Doc<"snapshots">["status"]}
                        snapshotId={item.snapshotId}
                        disableSeparators
                      />
                    </div>
                  </foreignObject>
                </g>
              );
            }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
          {/* Actual R-Multiple line (calculated from TPSL entries) */}
          {actualData && actualData.length > 0 && (
            <Line
              type="monotone"
              dataKey="actualRMultiple"
              stroke="url(#actualRMultipleGradient)"
              strokeWidth={2}
              dot={({ cx, cy, payload }) => {
                if (cx === undefined || cy === undefined) return null;

                const item = payload as EvolutionChartData & {
                  actualRMultiple?: number;
                  actualRMultipleOriginal?: number | null;
                };
                const value = item.actualRMultipleOriginal;
                if (value === null || value === undefined) return null;

                const isAboveOne = value >= 1;
                const dotColor = isAboveOne ? emeraldGreen : roseRed;

                return (
                  <circle cx={cx} cy={cy} r={4} fill={dotColor} stroke="none" />
                );
              }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as EvolutionChartData & {
                  actualRMultipleOriginal?: number | null;
                };
                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg font-mono">
                    <div className="mb-2">
                      <StatusOption
                        value={data.status as Doc<"snapshots">["status"]}
                        snapshotId={data.snapshotId}
                        disableSeparators
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      R-Multiple: {formatRMultiple(data.rMultiple)}
                    </p>
                    {data.actualRMultipleOriginal !== null &&
                      data.actualRMultipleOriginal !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Actual R-Multiple:{" "}
                          <span style={{ color: emeraldGreen }}>
                            {formatRMultiple(data.actualRMultipleOriginal)}
                          </span>
                        </p>
                      )}
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(data.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
