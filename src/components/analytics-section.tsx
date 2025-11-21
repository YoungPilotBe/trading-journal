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

const EvolutionLegend = () => {
  return (
    <div className="flex items-center gap-4">
      {/* R-Multiple (dashed line) */}
      <div className="flex items-center gap-2">
        <svg width="32" height="2" className="overflow-visible">
          <line
            x1="0"
            y1="1"
            x2="32"
            y2="1"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>
        <span className="text-xs font-mono text-muted-foreground">
          R-Multiple
        </span>
      </div>
      {/* Actual R-Multiple (solid line) */}
      <div className="flex items-center gap-2">
        <svg width="32" height="2" className="overflow-visible">
          <line
            x1="0"
            y1="1"
            x2="32"
            y2="1"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <span className="text-xs font-mono text-muted-foreground">
          Actual R-Multiple
        </span>
      </div>
    </div>
  );
};

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-mono text-sm font-medium text-muted-foreground/60">
            R-Multiple Evolution
          </CardTitle>
          <EvolutionLegend />
        </CardHeader>
        <CardContent className="">
          <Chart chartType="r-multiple-evolution" props={{ tradeSetupId }} />
        </CardContent>
      </Card>
      <Card className="bg-transparent flex flex-col">
        <CardContent className="flex-1">
          <Chart
            chartType="r-multiple"
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
