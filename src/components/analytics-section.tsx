import Chart from "@/charts/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Id } from "convex/_generated/dataModel";

type AnalyticsSectionProps = {
  tradeSetupId: Id<"trade_setups">;
};

export function AnalyticsSection({ tradeSetupId }: AnalyticsSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle className="font-mono text-sm font-medium text-muted-fore-ground/60">
            Risk:Reward Evolution
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <Chart chartType="risk-reward-evolution" props={{ tradeSetupId }} />
        </CardContent>
      </Card>
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle className="font-mono text-sm font-medium text-muted-fore-ground/60">
            Risk:Reward Evolution
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <Chart chartType="risk-reward-evolution" props={{ tradeSetupId }} />
        </CardContent>
      </Card>
    </div>
  );
}
