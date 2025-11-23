import { Skeleton } from "@/components/ui/skeleton";
import { formatRMultiple } from "@/lib/utils";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  BaseChartConfig,
  EmotionChartColors,
  EmotionChartData,
} from "./chart.types";

type EmotionChartProps = {
  data: EmotionChartData[] | null;
  chartConfig: BaseChartConfig | null;
  chartColors: EmotionChartColors | null;
  isLoading?: boolean;
};

export const EmotionChart = ({
  data,
  chartConfig,
  chartColors,
  isLoading = false,
}: EmotionChartProps) => {
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
        <p>No emotion data available</p>
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

  // Format emotion labels (capitalize first letter)
  const formatEmotion = (emotion: string) => {
    return emotion.charAt(0).toUpperCase() + emotion.slice(1);
  };

  // Render bar chart
  if (chartConfig.type === "bar") {
    return (
      <div className="w-full h-[400px] outline-none">
        <ResponsiveContainer width="100%" height="100%" className="outline-none">
          <BarChart
            data={data}
            margin={{ top: 50, right: 30, left: 20, bottom: 60 }}
            barCategoryGap="20%"
          >
            <defs>
              <pattern
                id="hatch-red-emotion"
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
                id="hatch-white-emotion"
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
              dataKey="emotion"
              tickFormatter={formatEmotion}
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
              tickFormatter={(value) => formatRMultiple(value)}
              tick={{ fontFamily: "monospace", fontSize: 12 }}
              domain={[0, "auto"]}
            />
            <ReferenceLine
              y={0}
              stroke="#525252"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.3}
            />
            <Tooltip
              cursor={{ fill: "oklch(0.553 0.013 58.071 / 0.25)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as EmotionChartData;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg font-mono">
                      <p className="text-xs text-foreground font-medium mb-1">
                        {formatEmotion(data.emotion)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        R-Multiple:{" "}
                        {formatRMultiple(data.avgRMultiple, {
                          addPrefix: true,
                        })}
                        R
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Count: {data.count}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="avgRMultiple"
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

                const isNegative = payload.avgRMultiple < 0;

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
                      fill={
                        isNegative ? "url(#hatch-red-emotion)" : "url(#hatch-white-emotion)"
                      }
                      stroke={isNegative ? "rgb(225 29 72)" : "rgb(255 255 255)"}
                      strokeWidth={1.5}
                      rx={4}
                      ry={4}
                    />
                  </g>
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Render pie chart (using neutral colors similar to template chart)
  if (chartConfig.type === "pie") {
    // Prepare data for pie chart (using avgRMultiple as value)
    const pieData = data.map((item) => ({
      name: formatEmotion(item.emotion),
      value: item.avgRMultiple,
      count: item.count,
      // Use neutral colors - white for positive, muted gray for negative
      color: item.avgRMultiple >= 0 ? "rgb(255 255 255)" : "rgb(163 163 163)",
    }));

    return (
      <div className="w-full h-[400px] outline-none">
        <ResponsiveContainer width="100%" height="100%" className="outline-none">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({
                name,
                value,
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
              }) => {
                if (
                  midAngle === undefined ||
                  innerRadius === undefined ||
                  outerRadius === undefined
                ) {
                  return null;
                }
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text
                    x={x}
                    y={y}
                    fill="currentColor"
                    textAnchor={x > cx ? "start" : "end"}
                    dominantBaseline="central"
                    style={{ fontFamily: "monospace", fontSize: "12px" }}
                    className="fill-foreground"
                  >
                    {`${name}: ${formatRMultiple(value)}`}
                  </text>
                );
              }}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as (typeof pieData)[0];
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg font-mono">
                      <p className="text-xs text-foreground font-medium mb-1">
                        {data.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        R-Multiple:{" "}
                        {formatRMultiple(data.value, {
                          addPrefix: true,
                        })}
                        R
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Count: {data.count}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Fallback for unknown chart type
  return (
    <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground font-mono">
      <p>Unknown chart type: {chartConfig.type}</p>
    </div>
  );
};
