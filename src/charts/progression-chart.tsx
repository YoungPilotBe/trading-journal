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

  // Calculate remaining position size percentage
  const calculateRemainingPosition = (): number => {
    if (!data || data.length === 0) return 100;

    // Sum all margins from hit TP/SL entries (excluding ghost paths)
    let totalHitMargin = 0;
    const processedEntryIds = new Set<string>();

    for (const point of data) {
      // Only count actual hits, not ghost paths or start points
      if (
        point.isHit &&
        !point.isGhost &&
        point.margin !== undefined &&
        point.type !== "start" &&
        point.tpslEntryId
      ) {
        // Avoid double-counting if same entry appears multiple times
        const entryId = point.tpslEntryId;
        if (!processedEntryIds.has(entryId)) {
          processedEntryIds.add(entryId);
          const marginValue = parseMarginValue(point.margin);
          if (marginValue !== null && !isNaN(marginValue) && marginValue >= 0) {
            totalHitMargin += marginValue;
          }
        }
      }
    }

    // Remaining position = 100% - total hit margin
    const remaining = Math.max(0, Math.min(100, 100 - totalHitMargin));
    return remaining;
  };

  const remainingPosition = calculateRemainingPosition();

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

  // Helper function to find the start point (zero point)
  const findStartPoint = (
    points: ProgressionChartData[]
  ): ProgressionChartData | null => {
    return points.find((p) => p.type === "start") || null;
  };

  // Helper function to group points by type and sort by x-coordinate
  const groupPointsByType = (
    points: ProgressionChartData[],
    type: "tp" | "sl"
  ): ProgressionChartData[] => {
    return points.filter((p) => p.type === type).sort((a, b) => a.x - b.x);
  };

  // Helper function to determine line color based on ending point status
  const getLineColor = (point: ProgressionChartData): string => {
    if (point.isHit) {
      return "oklch(0.96 0.01 106.423)"; // white
    }
    return "oklch(0.553 0.013 58.071)"; // neutral
  };

  // Helper function to create line segments based on reference point system
  // When a point is hit, it becomes the new reference and connects to next TP and current SL
  const createLineSegmentsWithReference = (
    startPoint: ProgressionChartData,
    tpPoints: ProgressionChartData[],
    slPoints: ProgressionChartData[]
  ): Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    fromPoint: ProgressionChartData;
    toPoint: ProgressionChartData;
  }> => {
    const segments: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      fromPoint: ProgressionChartData;
      toPoint: ProgressionChartData;
    }> = [];

    if (tpPoints.length === 0 && slPoints.length === 0) return segments;

    // Helper to connect reference to a target point if consecutive
    const connectIfConsecutive = (
      reference: ProgressionChartData,
      target: ProgressionChartData
    ) => {
      if (target.x === reference.x + 1) {
        segments.push({
          x1: reference.x,
          y1: reference.y,
          x2: target.x,
          y2: target.y,
          color: getLineColor(target),
          fromPoint: reference,
          toPoint: target,
        });
      }
    };

    // Start with zero point as reference
    let currentReference: ProgressionChartData = startPoint;
    let nextTpIndex = 0;
    let currentSlIndex = 0; // Current SL (the one that hasn't been hit yet)

    // From zero point, connect to first TP and first SL if consecutive
    if (tpPoints.length > 0) {
      connectIfConsecutive(currentReference, tpPoints[0]);
    }
    if (slPoints.length > 0) {
      connectIfConsecutive(currentReference, slPoints[0]);
    }

    // Combine all points and sort by x-coordinate to process chronologically
    const allPoints = [...tpPoints, ...slPoints].sort((a, b) => a.x - b.x);

    // Process points chronologically
    for (const point of allPoints) {
      // Check if this point is consecutive from current reference
      if (point.x === currentReference.x + 1) {
        // Connect reference to this point
        connectIfConsecutive(currentReference, point);

        // If this point is hit, it becomes the new reference
        if (point.isHit) {
          currentReference = point;

          // Update indices based on what was hit
          if (point.type === "tp") {
            // Find which TP index this was and move to next TP
            const tpIdx = tpPoints.findIndex((tp) => tp.x === point.x);
            if (tpIdx !== -1) {
              nextTpIndex = tpIdx + 1;
            }
          } else if (point.type === "sl") {
            // Find which SL index this was and move to next SL
            const slIdx = slPoints.findIndex((sl) => sl.x === point.x);
            if (slIdx !== -1) {
              currentSlIndex = slIdx + 1;
            }
          }

          // From new reference, connect to next TP and current SL if consecutive
          // Connect to next TP
          if (nextTpIndex < tpPoints.length) {
            connectIfConsecutive(currentReference, tpPoints[nextTpIndex]);
          }

          // Connect to current SL (the one that hasn't been hit yet)
          if (currentSlIndex < slPoints.length) {
            connectIfConsecutive(currentReference, slPoints[currentSlIndex]);
          }
        }
      }
    }

    return segments;
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

  // Find start point and create line segments based on reference point system
  const startPoint = findStartPoint(data);
  const tpPoints = groupPointsByType(data, "tp");
  const slPoints = groupPointsByType(data, "sl");

  // Create line segments using reference point logic
  // This will create segments for both TP and SL based on which becomes reference
  const allLineSegments = startPoint
    ? createLineSegmentsWithReference(startPoint, tpPoints, slPoints)
    : [];

  // Separate segments by type for rendering
  const tpLineSegments = allLineSegments.filter(
    (seg) => seg.toPoint.type === "tp"
  );
  const slLineSegments = allLineSegments.filter(
    (seg) => seg.toPoint.type === "sl"
  );

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
    <div className="w-full h-[400px] relative">
      {/* Position Size Indicator - Top Right */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        {/* Battery Indicator */}
        <div className="flex flex-col items-center gap-1">
          {/* Battery Container */}
          <div
            className="relative w-6 h-16 bg-background/50 overflow-hidden"
            style={{
              border: "1px solid oklch(0.85 0.01 106.423)",
            }}
          >
            {/* Filled portion with hatching */}
            {remainingPosition > 0 && (
              <div
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: `${remainingPosition}%`,
                  backgroundColor: "transparent",
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 5px,
                    white 5px,
                    white 6px
                  )`,
                }}
              />
            )}
            {/* Empty portion */}
            {remainingPosition < 100 && (
              <div
                className="absolute top-0 left-0 right-0 bg-background/80"
                style={{
                  height: `${100 - remainingPosition}%`,
                }}
              />
            )}
          </div>
          {/* Percentage Label */}
          <span className="text-xs font-mono text-muted-foreground">
            {remainingPosition.toFixed(0)}%
          </span>
        </div>
      </div>
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
          {/* Render TP connecting lines */}
          {tpLineSegments.length > 0 && (
            <Scatter
              name="TPLines"
              isAnimationActive={false}
              data={tpLineSegments.map((segment) => ({
                x: segment.x2,
                y: segment.y2,
                x1: segment.x1,
                y1: segment.y1,
                color: segment.color,
                isHit: segment.toPoint.isHit,
              }))}
              fill="transparent"
              shape={(props: unknown) => {
                const scatterProps = props as {
                  cx?: number;
                  cy?: number;
                  payload?: {
                    x: number;
                    y: number;
                    x1: number;
                    y1: number;
                    color: string;
                    isHit?: boolean;
                  };
                };
                const { cx, cy, payload } = scatterProps;

                if (cx === undefined || cy === undefined || !payload) {
                  return <g />;
                }

                // Calculate the start point's chart coordinates
                // Using Recharts' scaling based on current point position
                const yRange = maxValue - minValue || 1; // Avoid division by zero

                // Calculate chart dimensions from current point's chart coordinates
                // For x: cx = margin.left + (x2 / maxX) * chartWidth
                const chartWidth =
                  payload.x > 0 && maxX > 0
                    ? ((cx - margin.left) * maxX) / payload.x
                    : 400 - margin.left - margin.right;

                // For y: cy is measured from top, and y increases downward
                // Recharts YAxis: cy = margin.top + chartHeight - ((y2 - minValue) / yRange) * chartHeight
                // So: cy - margin.top = chartHeight * (1 - (y2 - minValue) / yRange)
                const normalizedY = (payload.y - minValue) / yRange;
                const chartHeight =
                  normalizedY < 1 && normalizedY >= 0
                    ? (cy - margin.top) / (1 - normalizedY)
                    : 400 - margin.top - margin.bottom;

                // Calculate start point coordinates using the same scale
                const startCx = margin.left + (payload.x1 / maxX) * chartWidth;
                const startCy =
                  margin.top +
                  chartHeight -
                  ((payload.y1 - minValue) / yRange) * chartHeight;

                return (
                  <g>
                    <line
                      x1={startCx}
                      y1={startCy}
                      x2={cx}
                      y2={cy}
                      stroke={payload.color}
                      strokeWidth={1.5}
                      {...(payload.isHit ? {} : { strokeDasharray: "3 3" })}
                    />
                  </g>
                );
              }}
            />
          )}
          {/* Render SL connecting lines */}
          {slLineSegments.length > 0 && (
            <Scatter
              name="SLLines"
              isAnimationActive={false}
              data={slLineSegments.map((segment) => ({
                x: segment.x2,
                y: segment.y2,
                x1: segment.x1,
                y1: segment.y1,
                color: segment.color,
                isHit: segment.toPoint.isHit,
              }))}
              fill="transparent"
              shape={(props: unknown) => {
                const scatterProps = props as {
                  cx?: number;
                  cy?: number;
                  payload?: {
                    x: number;
                    y: number;
                    x1: number;
                    y1: number;
                    color: string;
                    isHit?: boolean;
                  };
                };
                const { cx, cy, payload } = scatterProps;

                if (cx === undefined || cy === undefined || !payload) {
                  return <g />;
                }

                // Calculate the start point's chart coordinates
                // Using Recharts' scaling based on current point position
                const yRange = maxValue - minValue || 1; // Avoid division by zero

                // Calculate chart dimensions from current point's chart coordinates
                const chartWidth =
                  payload.x > 0 && maxX > 0
                    ? ((cx - margin.left) * maxX) / payload.x
                    : 400 - margin.left - margin.right;

                const normalizedY = (payload.y - minValue) / yRange;
                const chartHeight =
                  normalizedY < 1 && normalizedY >= 0
                    ? (cy - margin.top) / (1 - normalizedY)
                    : 400 - margin.top - margin.bottom;

                // Calculate start point coordinates using the same scale
                const startCx = margin.left + (payload.x1 / maxX) * chartWidth;
                const startCy =
                  margin.top +
                  chartHeight -
                  ((payload.y1 - minValue) / yRange) * chartHeight;

                return (
                  <g>
                    <line
                      x1={startCx}
                      y1={startCy}
                      x2={cx}
                      y2={cy}
                      stroke={payload.color}
                      strokeWidth={1.5}
                      {...(payload.isHit ? {} : { strokeDasharray: "3 3" })}
                    />
                  </g>
                );
              }}
            />
          )}
          {/* Render points as scatter plot */}
          <Scatter
            name="Points"
            isAnimationActive={false}
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
            isAnimationActive={false}
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
            isAnimationActive={false}
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
