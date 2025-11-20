import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
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

  // Format R-Multiple to 2 decimal places
  const formatRMultiple = (value: number) => {
    return value.toFixed(2);
  };

  // Render bar chart
  if (chartConfig.type === "bar") {
    return (
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <XAxis
              dataKey="emotion"
              tickFormatter={formatEmotion}
              axisLine={false}
              tickLine={false}
              className="text-xs text-muted-foreground font-mono"
              tick={{ fontFamily: "monospace", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              className="text-xs text-muted-foreground font-mono"
              tickFormatter={formatRMultiple}
              tick={{ fontFamily: "monospace", fontSize: 12 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as EmotionChartData;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg font-mono">
                      <p className="text-xs text-muted-foreground">
                        {formatEmotion(data.emotion)}: {formatRMultiple(data.avgRMultiple)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="avgRMultiple"
              fill={chartColors.primary}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Render pie chart
  if (chartConfig.type === "pie") {
    // Prepare data for pie chart (using avgRMultiple as value)
    const pieData = data.map((item, index) => ({
      name: formatEmotion(item.emotion),
      value: item.avgRMultiple,
      count: item.count,
      color: index % 2 === 0 ? chartColors.primary : chartColors.secondary,
    }));

    return (
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
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
                      <p className="text-xs text-muted-foreground">
                        {data.name}: {formatRMultiple(data.value)}
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
