import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

type TemplateChartData = {
  templateId: string;
  templateTitle: string;
  avgRiskReward: number;
  count: number;
};

type TemplatePieChartProps = {
  data: TemplateChartData[] | null;
  chartConfig: { type: string; xAxis: string; yAxis: string } | null;
  chartColors:
    | {
        primary: string;
        secondary: string;
        colors: string[];
      }
    | null;
  isLoading?: boolean;
};

export const TemplatePieChart = ({
  data,
  chartConfig,
  chartColors,
  isLoading = false,
}: TemplatePieChartProps) => {
  if (isLoading) {
    return (
      <div className="w-full h-[400px] space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-full w-full rounded-full" />
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

  if (!chartColors || !chartColors.colors) {
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
            label={({ name, value }) => `${name}: ${formatRiskReward(value)}`}
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
                const data = payload[0].payload as typeof pieData[0];
                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
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
            wrapperStyle={{ fontSize: "12px" }}
            formatter={(value) => value}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

