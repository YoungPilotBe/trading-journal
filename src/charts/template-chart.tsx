import { Skeleton } from "@/components/ui/skeleton";
import { formatRiskReward } from "@/lib/utils";
import type { Id } from "convex/_generated/dataModel";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Bar,
  BarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  BaseChartConfig,
  TemplateChartColors,
  TemplateChartData,
} from "./chart.types";

type TemplateChartProps = {
  data: TemplateChartData[] | null;
  chartConfig: BaseChartConfig | null;
  chartColors: TemplateChartColors | null;
  isLoading?: boolean;
  templateId?: Id<"trade_templates">;
  filterType?: "all" | "closed";
};

export const TemplateChart = ({
  data,
  chartConfig,
  chartColors,
  isLoading = false,
  templateId,
}: TemplateChartProps) => {
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
        <p>No template data available</p>
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

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 50, right: 30, left: 20, bottom: 60 }}
          barCategoryGap="20%"
        >
          <defs>
            <pattern
              id="hatch-red"
              patternUnits="userSpaceOnUse"
              width="4"
              height="4"
            >
              <path
                d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2"
                stroke="rgb(225 29 72)"
                strokeWidth="0.5"
              />
            </pattern>
            <pattern
              id="hatch-white"
              patternUnits="userSpaceOnUse"
              width="4"
              height="4"
            >
              <path
                d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,5 l 2,-2"
                stroke="rgb(255 255 255)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <XAxis
            dataKey="templateTitle"
            angle={-45}
            textAnchor="end"
            height={80}
            axisLine={false}
            tickLine={false}
            padding={{ left: 20, right: 20 }}
            className="text-xs text-muted-foreground font-mono"
            tick={{ fontFamily: "monospace", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            className="text-xs text-muted-foreground font-mono"
            tickFormatter={(value) => formatRiskReward(value)}
            tick={{ fontFamily: "monospace", fontSize: 12 }}
            domain={["auto", "auto"]}
          />
          <ReferenceLine
            y={0}
            stroke="#525252"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.3}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as TemplateChartData;
                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg font-mono">
                    <p className="text-xs text-foreground font-medium mb-1">
                      {data.templateTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Risk:Reward:{" "}
                      {formatRiskReward(data.avgRiskReward, {
                        addPrefix: true,
                      })}
                      R
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Usage: {data.usagePercentage.toFixed(1)}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="avgRiskReward"
            barSize={20}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            shape={(props: any) => {
              const { x, y, width, height, payload } = props;
              if (
                typeof x !== "number" ||
                typeof y !== "number" ||
                typeof width !== "number" ||
                typeof height !== "number" ||
                !payload
              ) {
                return <g />;
              }

              const isNegative = payload.avgRiskReward < 0;
              const isHighlighted =
                templateId !== undefined &&
                String(templateId) === String(payload.templateId);

              // For negative bars, Recharts provides:
              // - y: the zero line position
              // - height: negative value (e.g., -50)
              // We need to calculate the actual y position and use absolute height
              const barY = isNegative ? y + height : y;
              const barHeight = Math.abs(height);

              return (
                <g>
                  <rect
                    x={x}
                    y={barY}
                    width={width}
                    height={barHeight}
                    fill={isNegative ? "url(#hatch-red)" : "url(#hatch-white)"}
                    stroke={isNegative ? "rgb(225 29 72)" : "rgb(255 255 255)"}
                    strokeWidth={1.5}
                    rx={4}
                    ry={4}
                  />
                  {isHighlighted && (
                    <foreignObject
                      x={x + width / 2 - 8}
                      y={isNegative ? barY + barHeight + 4 : barY - 24}
                      width={16}
                      height={16}
                    >
                      <div className="flex justify-center items-center">
                        {isNegative ? (
                          <ChevronUp className="h-4 w-4 text-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-foreground" />
                        )}
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
