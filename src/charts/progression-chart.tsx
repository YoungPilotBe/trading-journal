import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "convex/_generated/dataModel";
import {
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  BaseChartConfig,
  EvolutionChartColors,
  ProgressionChartData,
} from "./chart.types";

type ProgressionChartProps = {
  data: ProgressionChartData[] | null;
  chartConfig: BaseChartConfig | null;
  chartColors: EvolutionChartColors | null;
  isLoading?: boolean;
  tradeSetupId?: Id<"trade_setups">;
};

export const ProgressionChart = ({
  data,
  chartConfig,
  chartColors,
  isLoading = false,
}: ProgressionChartProps) => {
  if (isLoading) {
    return (
      <div className="w-full h-[400px] space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (
    !data ||
    !Array.isArray(data) ||
    data.length === 0 ||
    (data.length === 1 && data[0].type === "start") ||
    !chartColors ||
    !chartConfig
  ) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground font-mono">
        <p>
          {!data || data.length === 0
            ? "No progression data available"
            : !chartColors || !chartConfig
              ? "Chart configuration missing"
              : "Insufficient data to render progression chart"}
        </p>
      </div>
    );
  }

  const formatRMultiple = (value: number | null) => {
    if (value === null || value === undefined) return "N/A";
    return value.toFixed(2);
  };

  const parseMarginValue = (
    margin: number | string | undefined | null
  ): number | null => {
    if (margin === undefined || margin === null) return null;
    if (typeof margin === "number") return margin;
    if (typeof margin === "string") {
      const parsed = parseFloat(margin);
      return !isNaN(parsed) ? parsed : null;
    }
    return null;
  };

  const getPointColor = (point: ProgressionChartData | undefined) => {
    if (!point) return "#8884d8";
    if (point.type === "tp") return "oklch(0.696 0.17 162.48)";
    if (point.type === "sl") return "oklch(0.65 0.18 15)";
    return "oklch(0.553 0.013 58.071)";
  };

  const getPointRadius = (point: ProgressionChartData | undefined) => {
    if (!point) return 4;
    if (point.isHit) return 5;
    if (point.isGhost) return 3;
    return 4;
  };

  const generateBadgeLabel = (
    point: ProgressionChartData | undefined
  ): string => {
    if (!point || point.type === "start") return "";
    const typeLabel = point.type === "tp" ? "TP" : "SL";
    const index = point.entryIndex ?? 1;
    const marginValue = parseMarginValue(point.margin);
    if (marginValue !== null && !isNaN(marginValue) && marginValue >= 0) {
      return `${typeLabel}${index} @ ${marginValue}%`;
    }
    return `${typeLabel}${index}`;
  };

  const getTypeLabel = (type: "tp" | "sl" | "start") => {
    if (type === "tp") return "Take Profit";
    if (type === "sl") return "Stop Loss";
    return "Start";
  };

  const calculateRightEdgePosition = (
    cx: number,
    currentX: number,
    maxX: number,
    leftEdgeX: number
  ): number => {
    const xScale = currentX > 0 ? (cx - leftEdgeX) / currentX : 0;
    return leftEdgeX + maxX * xScale;
  };

  const allYValues = data.map((d) => d.y);
  const minValue = allYValues.length > 0 ? Math.min(...allYValues, 0) : -1;
  const maxValue = allYValues.length > 0 ? Math.max(...allYValues, 1) : 1;
  const allXValues = data.map((d) => d.x);
  const maxX = allXValues.length > 0 ? Math.max(...allXValues, 0) + 1 : 0;
  const margin = { top: 50, right: 120, left: 60, bottom: 60 };

  // Check if we have points to display
  if (data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground font-mono">
        <div className="text-center">
          <p>No points to display</p>
          <p className="text-xs mt-2">
            Try adding TP/SL entries to see progression paths
          </p>
        </div>
      </div>
    );
  }

  // Pass complete point data directly as props - no matching needed
  const scatterData = data.map((point) => ({
    x: point.x,
    y: point.y,
    originalPoint: point,
  }));

  const uniqueYLines = new Map<
    number,
    { leftmostX: number; point: ProgressionChartData }
  >();
  for (const item of scatterData) {
    const point = item.originalPoint;
    if (point && point.type !== "start") {
      const existing = uniqueYLines.get(item.y);
      if (!existing || item.x < existing.leftmostX) {
        uniqueYLines.set(item.y, {
          leftmostX: item.x,
          point,
        });
      }
    }
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={margin}>
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, maxX]}
            axisLine={false}
            tickLine={false}
            hide
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[minValue, maxValue]}
            axisLine={false}
            tickLine={false}
            hide
          />
          <ReferenceLine
            y={0}
            stroke="oklch(0.553 0.013 58.071)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          {/* Render points as scatter plot */}
          <Scatter
            name="Points"
            data={scatterData}
            fill="#8884d8"
            shape={(props: unknown) => {
              const scatterProps = props as {
                cx?: number;
                cy?: number;
                payload?: {
                  x: number;
                  y: number;
                  originalPoint?: ProgressionChartData;
                };
              };
              const { cx, cy, payload } = scatterProps;

              if (cx === undefined || cy === undefined) {
                return <g />;
              }

              const point = payload?.originalPoint;
              const color = getPointColor(point);
              const radius = getPointRadius(point);
              const badgeLabel = generateBadgeLabel(point);
              const isLastPoint = point?.isLastPoint ?? false;
              const triangleSize = 6;

              return (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={color}
                    strokeWidth={point?.isHit ? 2 : 0}
                    stroke="oklch(0.96 0.01 106.423)"
                  />
                  {isLastPoint && (
                    <polygon
                      points={`${cx},${cy - radius - triangleSize} ${cx - triangleSize / 2},${cy - radius} ${cx + triangleSize / 2},${cy - radius}`}
                      fill={color}
                      stroke="oklch(0.96 0.01 106.423)"
                      strokeWidth={1}
                    />
                  )}
                  {badgeLabel && (
                    <foreignObject
                      x={cx - 40}
                      y={cy - radius - 25}
                      width={80}
                      height={20}
                    >
                      <div className="flex justify-center">
                        <span className="text-xs font-mono text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border">
                          {badgeLabel}
                        </span>
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            }}
          />
          {/* Render dotted lines for unique Y values extending to right edge */}
          {/* Create invisible points at right edge (maxX) to get their actual chart coordinates */}
          <Scatter
            name="RightEdgePoints"
            data={Array.from(uniqueYLines.entries()).map(([y, { point }]) => ({
              x: maxX,
              y: y,
              point,
            }))}
            fill="transparent"
            shape={(props: unknown) => {
              const scatterProps = props as {
                cx?: number;
                cy?: number;
                payload?: {
                  x: number;
                  y: number;
                  point?: ProgressionChartData;
                };
              };
              const { cx, cy, payload } = scatterProps;

              if (cx === undefined || cy === undefined || !payload) {
                return <g />;
              }

              // Store the right edge cx position for this Y value
              // We'll use this to draw lines from leftmost points
              // For now, just render the R-Multiple label at the right edge
              return (
                <g>
                  {/* R-Multiple label on the right */}
                  <foreignObject x={cx + 5} y={cy - 10} width={60} height={20}>
                    <div className="flex items-center">
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatRMultiple(payload.y)}R
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            }}
          />
          {/* Create a separate Scatter for line start points (leftmost at each Y) */}
          <Scatter
            name="LineStartPoints"
            data={Array.from(uniqueYLines.entries()).map(
              ([y, { leftmostX, point }]) => ({
                x: leftmostX,
                y: y,
                point,
                rightEdgeX: maxX, // Include maxX for calculation
              })
            )}
            fill="transparent"
            shape={(props: unknown) => {
              const scatterProps = props as {
                cx?: number;
                cy?: number;
                payload?: {
                  x: number;
                  y: number;
                  point?: ProgressionChartData;
                  rightEdgeX?: number;
                };
              };
              const { cx, cy, payload } = scatterProps;

              if (cx === undefined || cy === undefined || !payload) {
                return <g />;
              }

              const chartRightEdge = calculateRightEdgePosition(
                cx,
                payload.x,
                maxX,
                margin.left
              );

              return (
                <g>
                  {/* Dotted line extending to the right edge (maxX) */}
                  <line
                    x1={cx}
                    y1={cy}
                    x2={chartRightEdge}
                    y2={cy}
                    stroke="oklch(0.553 0.013 58.071)"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    opacity={0.5}
                  />
                </g>
              );
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const pointData = payload[0].payload as {
                  x: number;
                  y: number;
                  originalPoint?: ProgressionChartData;
                };
                const point = pointData.originalPoint;
                if (!point) return null;

                const typeLabel = getTypeLabel(point.type);
                const badgeText = generateBadgeLabel(point) || null;

                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg font-mono">
                    {badgeText && (
                      <p className="text-xs font-semibold mb-2">{badgeText}</p>
                    )}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Type:</span> {typeLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">R-Multiple:</span>{" "}
                        {formatRMultiple(point.y)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Snapshot:</span>{" "}
                        {point.x}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Status:</span>{" "}
                        {point.isHit
                          ? "Hit"
                          : point.isGhost
                            ? "Ghost Path"
                            : "Not Hit"}
                      </p>
                      {point.margin !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold">Margin:</span>{" "}
                          {point.margin}%
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
