import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
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
};

export const TemplateChart = ({
  data,
  chartConfig,
  chartColors,
  isLoading = false,
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
      <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground">
        <p>No template data available</p>
      </div>
    );
  }

  if (!chartColors || !chartConfig) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground">
        <p>Chart configuration missing</p>
      </div>
    );
  }

  // Format risk reward to 2 decimal places
  const formatRiskReward = (value: number) => {
    return value.toFixed(2);
  };

  // Render bar chart
  if (chartConfig.type === "bar") {
    return (
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="templateTitle"
              className="text-xs text-muted-foreground font-mono"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontFamily: "monospace" }}
            />
            <YAxis
              className="text-xs text-muted-foreground font-mono"
              tickFormatter={formatRiskReward}
              tick={{ fontFamily: "monospace" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as TemplateChartData;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg font-mono">
                      <p className="font-semibold text-sm">
                        {data.templateTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Avg Risk/Reward: {formatRiskReward(data.avgRiskReward)}
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
              dataKey="avgRiskReward"
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
    // Prepare data for pie chart (using avgRiskReward as value)
    const pieData = data.map((item, index) => ({
      name: item.templateTitle,
      value: item.avgRiskReward,
      count: item.count,
      color: chartColors.colors[index % chartColors.colors.length],
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
                    {`${name}: ${formatRiskReward(value)}`}
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
                      <p className="font-semibold text-sm">{data.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Avg Risk/Reward: {formatRiskReward(data.value)}
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
            <Legend
              wrapperStyle={{ fontSize: "12px", fontFamily: "monospace" }}
              formatter={(value) => value}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Fallback for unknown chart type
  return (
    <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground">
      <p>Unknown chart type: {chartConfig.type}</p>
    </div>
  );
};
