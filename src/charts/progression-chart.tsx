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

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground font-mono">
        <p>No progression data available</p>
      </div>
    );
  }

  // Early return if we don't have enough data to render
  if (data.length === 1 && data[0].type === "start") {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground font-mono">
        <p>Insufficient data to render progression chart</p>
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

  // Build a map of reference points by their coordinates
  // This helps us find reference points when we need them
  const referencePointsMap = new Map<string, ProgressionChartData>();

  // Find the start point
  const startPoint = data.find((d) => d.type === "start");
  if (startPoint) {
    // Map both "start" and "start-0" to the start point
    referencePointsMap.set("start", startPoint);
    referencePointsMap.set("start-0", startPoint);
  }

  // Find all hit points (these are also reference points)
  // Store them by their coordinates for lookup
  for (const point of data) {
    if (point.isHit && !point.isGhost) {
      const coordKey = `${point.x}-${point.y}`;
      referencePointsMap.set(coordKey, point);
      // Also store by referencePointId if it exists
      if (point.referencePointId) {
        referencePointsMap.set(point.referencePointId, point);
      }
    }
  }

  // Group children by their reference point ID
  const childrenByRef = new Map<string, ProgressionChartData[]>();
  for (const point of data) {
    if (point.type === "start") continue;

    const refId = point.referencePointId;
    if (!childrenByRef.has(refId)) {
      childrenByRef.set(refId, []);
    }
    childrenByRef.get(refId)!.push(point);
  }

  // Build line segments: each reference point connects to its children
  const lineSegments: Array<{
    points: Array<{ x: number; y: number }>;
    isGhost: boolean;
    type: "tp" | "sl" | "start";
    key: string;
  }> = [];

  // For each reference point ID, find the reference point and its children
  for (const [refId, children] of childrenByRef.entries()) {
    // Find the reference point
    let refPoint = referencePointsMap.get(refId);

    // If not found by ID, try to find by coordinates
    // Look for a point that could be the reference (earlier snapshot, similar position)
    if (!refPoint && children.length > 0) {
      const firstChild = children[0];
      // Look for hit points at earlier snapshots
      const possibleRefs = data.filter(
        (d) =>
          (d.isHit && !d.isGhost && d.x < firstChild.x) ||
          (d.type === "start" && d.x < firstChild.x)
      );

      // Find the closest match by Y coordinate
      if (possibleRefs.length > 0) {
        refPoint = possibleRefs.reduce((closest, current) => {
          const closestDiff = Math.abs(closest.y - firstChild.y);
          const currentDiff = Math.abs(current.y - firstChild.y);
          return currentDiff < closestDiff ? current : closest;
        });
      }
    }

    if (!refPoint) {
      // Fallback to start point
      refPoint = startPoint;
    }

    if (!refPoint) continue;

    // Create line segments from reference point to each child
    for (const child of children) {
      lineSegments.push({
        points: [
          { x: refPoint.x, y: refPoint.y },
          { x: child.x, y: child.y },
        ],
        isGhost: child.isGhost,
        type: child.type,
        key: `line-${refPoint.x}-${refPoint.y}-${child.x}-${child.y}`,
      });
    }
  }

  // Calculate domain for Y axis
  const allYValues = data.map((d) => d.y);
  const minValue = allYValues.length > 0 ? Math.min(...allYValues, 0) : -1;
  const maxValue = allYValues.length > 0 ? Math.max(...allYValues, 1) : 1;

  // Calculate domain for X axis - show all snapshots
  const allXValues = data.map((d) => d.x);
  const maxX = allXValues.length > 0 ? Math.max(...allXValues, 0) + 1 : 0;

  // Colors
  const tpColor = "oklch(0.696 0.17 162.48)"; // emerald green for TP
  const slColor = "oklch(0.65 0.18 15)"; // rose red for SL
  const startColor = "oklch(0.553 0.013 58.071)"; // muted foreground

  // Create a unified dataset for all points (needed for Recharts to render properly)
  // Include all unique points from all snapshots
  const allPointsMap = new Map<string, { x: number; y: number }>();
  for (const d of data) {
    const key = `${d.x}-${d.y}`;
    if (!allPointsMap.has(key)) {
      allPointsMap.set(key, { x: d.x, y: d.y });
    }
  }
  const allPoints = Array.from(allPointsMap.values());

  const margin = { top: 20, right: 60, left: 60, bottom: 60 };

  // Check if we have points to display
  if (allPoints.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground font-mono">
        <div className="text-center">
          <p>No points to display</p>
          <p className="text-xs mt-2">
            {data.length > 0
              ? "Try adding TP/SL entries to see progression paths"
              : "No data available"}
          </p>
        </div>
      </div>
    );
  }

  // Prepare scatter data with all necessary info
  const scatterData = allPoints.map((p) => {
    const originalPoint = data.find((d) => d.x === p.x && d.y === p.y);
    return {
      x: p.x,
      y: p.y,
      originalPoint,
    };
  });

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={margin}>
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, maxX]}
            tickCount={maxX + 1}
            axisLine={true}
            tickLine={true}
            tick={{ fill: "currentColor", fontSize: 12 }}
            label={{
              value: "Snapshot",
              position: "insideBottom",
              offset: -10,
              style: { fill: "currentColor", fontSize: 12 },
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[minValue, maxValue]}
            axisLine={true}
            tickLine={true}
            tick={{ fill: "currentColor", fontSize: 12 }}
            label={{
              value: "R-Multiple",
              angle: -90,
              position: "insideLeft",
              style: { fill: "currentColor", fontSize: 12 },
            }}
          />
          <ReferenceLine
            y={0}
            stroke="oklch(0.553 0.013 58.071)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <ReferenceLine
            y={1}
            stroke="oklch(0.553 0.013 58.071)"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{
              value: "+1R",
              position: "left",
              fill: "oklch(0.553 0.013 58.071)",
              fontSize: 12,
              fontFamily: "monospace",
            }}
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

              // Always render something, even if no originalPoint
              const point = payload?.originalPoint;
              const color = point
                ? point.type === "tp"
                  ? tpColor
                  : point.type === "sl"
                    ? slColor
                    : startColor
                : "#8884d8";
              const radius = point
                ? point.isHit
                  ? 5
                  : point.isGhost
                    ? 3
                    : 4
                : 4;

              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={color}
                  strokeWidth={point?.isHit ? 2 : 0}
                  stroke="oklch(0.96 0.01 106.423)"
                />
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
                const point =
                  pointData.originalPoint ||
                  data.find((d) => d.x === pointData.x && d.y === pointData.y);

                if (!point) return null;

                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg font-mono max-w-md">
                    <p className="text-xs text-muted-foreground font-semibold mb-2">
                      Point Details
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Snapshot Index:</span>{" "}
                        {point.x}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">R-Multiple:</span>{" "}
                        {formatRMultiple(point.y)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Type:</span>{" "}
                        {point.type === "tp"
                          ? "Take Profit"
                          : point.type === "sl"
                            ? "Stop Loss"
                            : "Start"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Status:</span>{" "}
                        {point.isHit
                          ? "Hit"
                          : point.isGhost
                            ? "Ghost Path"
                            : "Not Hit"}
                      </p>
                      {point.tpslEntryId && (
                        <p className="text-xs text-muted-foreground break-all">
                          <span className="font-semibold">TP/SL Entry ID:</span>{" "}
                          {point.tpslEntryId}
                        </p>
                      )}
                      {point.snapshotId && (
                        <p className="text-xs text-muted-foreground break-all">
                          <span className="font-semibold">Snapshot ID:</span>{" "}
                          {point.snapshotId}
                        </p>
                      )}
                      {point.referencePointId && (
                        <p className="text-xs text-muted-foreground break-all">
                          <span className="font-semibold">
                            Reference Point ID:
                          </span>{" "}
                          {point.referencePointId}
                        </p>
                      )}
                      <div className="pt-2 mt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground font-semibold mb-1">
                          Debug Flags:
                        </p>
                        <p className="text-xs text-muted-foreground">
                          isHit: {point.isHit ? "true" : "false"} | isGhost:{" "}
                          {point.isGhost ? "true" : "false"}
                        </p>
                      </div>
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
