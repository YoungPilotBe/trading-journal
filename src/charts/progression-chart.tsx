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
  ProgressionSnapshotResult,
} from "./chart.types";

type ProgressionChartProps = {
  data: ProgressionChartData[] | null;
  chartConfig: BaseChartConfig | null;
  chartColors: EvolutionChartColors | null;
  isLoading?: boolean;
  tradeSetupId?: Id<"trade_setups">;
  snapshots: ProgressionSnapshotResult[] | null;
  currentSnapshotId: Id<"snapshots"> | null | undefined;
};

export const ProgressionChart = ({
  data,
  chartConfig,
  chartColors,
  isLoading = false,
  snapshots,
  currentSnapshotId,
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

  // Get remaining weight from current snapshot (server-calculated)
  const getRemainingWeight = (): number => {
    if (!snapshots || !currentSnapshotId) {
      // Fallback: find the last snapshot if currentSnapshotId is not provided
      const lastSnapshot = snapshots?.[snapshots.length - 1];
      return lastSnapshot?.remainingWeight ?? 100;
    }

    const currentSnapshot = snapshots.find(
      (s) => s.snapshotId === currentSnapshotId
    );
    return currentSnapshot?.remainingWeight ?? 100;
  };

  const remainingPosition = getRemainingWeight();

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

  const generateBadgeEntries = (
    point: ProgressionChartData | undefined
  ): Array<{ typeLabel: string; index: number; margin: number }> => {
    if (!point || point.type === "start") return [];

    // Backend always provides arrays for hit entries - just render them
    const margins = point.margins ?? [];
    const entryIndices = point.entryIndices ?? [];
    const entryTypes = point.entryTypes ?? [];

    const entries: Array<{ typeLabel: string; index: number; margin: number }> =
      [];
    for (let i = 0; i < margins.length; i++) {
      const typeLabel = entryTypes[i] === "tp" ? "TP" : "SL";
      const index = entryIndices[i] ?? i + 1;
      const marginValue = margins[i] ?? 0;
      entries.push({ typeLabel, index, margin: marginValue });
    }

    return entries;
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

  // Helper function to find the next unhit point of a given type from a reference point
  const findNextUnhitPoint = (
    reference: ProgressionChartData,
    points: ProgressionChartData[],
    type: "tp" | "sl"
  ): ProgressionChartData | null => {
    // Filter to points of the correct type that come after the reference
    const candidatePoints = points.filter(
      (p) => p.type === type && p.x > reference.x && !p.isHit
    );

    if (candidatePoints.length === 0) return null;

    // Return the one with the smallest x (next in sequence)
    return candidatePoints.reduce((next, current) =>
      current.x < next.x ? current : next
    );
  };

  // Helper function to create line segments based on reference point system
  // Simple approach: connect only from the latest reference point to next possible TP and SL
  // No ID matching - just connects to the next unhit TP/SL in sequence
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

    // Helper to connect reference to a target point
    const connectToPoint = (
      reference: ProgressionChartData,
      target: ProgressionChartData
    ) => {
      segments.push({
        x1: reference.x,
        y1: reference.y,
        x2: target.x,
        y2: target.y,
        color: getLineColor(target),
        fromPoint: reference,
        toPoint: target,
      });
    };

    // First, connect all consecutive hit points to show the path taken (solid lines)
    const allHitPoints = [...tpPoints, ...slPoints]
      .filter((p) => p.isHit)
      .sort((a, b) => a.x - b.x); // Sort ascending to process chronologically

    // Connect start point to first hit point
    if (allHitPoints.length > 0) {
      connectToPoint(startPoint, allHitPoints[0]);
    }

    // Connect consecutive hit points (regardless of x-coordinate gaps)
    // This handles cases where a TP/SL was modified while being hit, creating gaps
    for (let i = 0; i < allHitPoints.length - 1; i++) {
      const currentHit = allHitPoints[i];
      const nextHit = allHitPoints[i + 1];
      // Connect consecutive hits in the sequence, even if x-coordinates aren't consecutive
      connectToPoint(currentHit, nextHit);
    }

    // Find the latest reference point (the most recent hit point, or start if no hits)
    const latestReference =
      allHitPoints.length > 0
        ? allHitPoints[allHitPoints.length - 1]
        : startPoint;

    // Connect only from the latest reference point to next unhit TP and SL (ghost paths)
    const nextTP = findNextUnhitPoint(latestReference, tpPoints, "tp");
    const nextSL = findNextUnhitPoint(latestReference, slPoints, "sl");

    if (nextTP) {
      connectToPoint(latestReference, nextTP);
    }

    if (nextSL) {
      connectToPoint(latestReference, nextSL);
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
    <div className="w-full h-[400px] relative outline-none">
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
      <ResponsiveContainer width="100%" height="100%" className="outline-none">
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
              const badgeEntries = generateBadgeEntries(point);
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
                  {badgeEntries.length > 0 && (
                    <foreignObject
                      x={cx - 50}
                      y={cy - radius - badgeEntries.length * 22 - 20}
                      width={100}
                      height={badgeEntries.length * 22 + 10}
                    >
                      <div className="flex flex-col justify-center items-center gap-1">
                        {badgeEntries.map((entry, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-mono text-muted-foreground bg-background/80 px-2 py-0.5 rounded border border-border whitespace-nowrap"
                          >
                            {entry.typeLabel}
                            {entry.index} @ {entry.margin}%
                          </span>
                        ))}
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

                // Always use arrays (default approach)
                const hasArrays =
                  point.tpslEntryIds &&
                  point.tpslEntryIds.length > 0 &&
                  point.margins &&
                  point.margins.length > 0 &&
                  point.entryIndices &&
                  point.entryIndices.length > 0 &&
                  point.entryTypes &&
                  point.entryTypes.length > 0;

                const typeLabel = hasArrays
                  ? (point.entryTypes?.map((t) => getTypeLabel(t)).join(", ") ??
                    getTypeLabel(point.type))
                  : getTypeLabel(point.type);
                const badgeEntries = generateBadgeEntries(point);

                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg font-mono">
                    {badgeEntries.length > 0 && (
                      <div className="flex flex-col gap-1 mb-2">
                        {badgeEntries.map((entry, idx) => (
                          <p key={idx} className="text-xs font-semibold">
                            {entry.typeLabel}
                            {entry.index} @ {entry.margin}%
                          </p>
                        ))}
                      </div>
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
                      {hasArrays && point.margins ? (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold">Margins:</span>{" "}
                          {point.margins.join("%, ")}%
                        </p>
                      ) : (
                        point.margin !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-semibold">Margin:</span>{" "}
                            {point.margin}%
                          </p>
                        )
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
