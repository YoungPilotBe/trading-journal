import Chart from "@/charts/chart";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetTradeSetup } from "@/hooks/trade-setup/use-get-trade-setup";
import { Link } from "@tanstack/react-router";
import type { Id } from "convex/_generated/dataModel";
import { ChevronRight } from "lucide-react";

type AnalyticsSectionProps = {
  tradeSetupId: Id<"trade_setups">;
  templateFilter: "all" | "closed";
};

export function AnalyticsSection({
  tradeSetupId,
  templateFilter,
}: AnalyticsSectionProps) {
  const { data: tradeSetup } = useGetTradeSetup({
    id: tradeSetupId,
  });

  return (
    <div className="grid grid-cols-2 gap-2">
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle className="font-mono text-sm font-medium text-muted-foreground/60">
            Risk:Reward Evolution
          </CardTitle>
        </CardHeader>
        <CardContent className="">
          <Chart chartType="risk-reward-evolution" props={{ tradeSetupId }} />
        </CardContent>
      </Card>
      <Card className="bg-transparent flex flex-col">
        <CardContent className="flex-1">
          <Chart
            chartType="risk-reward"
            props={{
              templateId: tradeSetup?.trade_template,
              filterType: templateFilter,
            }}
          />
        </CardContent>
        <CardFooter className="flex justify-end mt-auto">
          <Link
            to="/dashboard/trade_templates"
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            View all templates
            <ChevronRight className="h-3 w-3" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
