import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

type EmotionChartData = {
  emotion: string;
  avgRiskReward: number;
  count: number;
};

type EmotionBarChartProps = {
  data: EmotionChartData[] | null;
  chartConfig: { type: string; xAxis: string; yAxis: string } | null;
  chartColors: { primary: string; secondary: string } | null;
  isLoading?: boolean;
};

export const EmotionBarChart = ({
  data,
  chartConfig,
  chartColors,
  isLoading = false,
}: EmotionBarChartProps) => {
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
        <p>No emotion data available</p>
      </div>
    );
  }

  if (!chartColors) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground">
        <p>Chart configuration missing</p>
      </div>
    );
  }

  // Format emotion labels (capitalize first letter)
  const formatEmotion = (emotion: string) => {
    return emotion.charAt(0).toUpperCase() + emotion.slice(1);
  };

  // Format risk reward to 2 decimal places
  const formatRiskReward = (value: number) => {
    return value.toFixed(2);
  };

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="emotion"
            tickFormatter={formatEmotion}
            className="text-xs text-muted-foreground"
          />
          <YAxis
            className="text-xs text-muted-foreground"
            tickFormatter={formatRiskReward}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload as EmotionChartData;
                return (
                  <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-sm">
                      {formatEmotion(data.emotion)}
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
};

