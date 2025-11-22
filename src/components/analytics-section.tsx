import Chart from "@/charts/chart";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePreloadProgressionCharts } from "@/hooks/charts/use-preload-progression-charts";
import { useGetTradeSetup } from "@/hooks/trade-setup/use-get-trade-setup";
import { Link, useSearch } from "@tanstack/react-router";
import type { Id } from "convex/_generated/dataModel";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

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
  const { snapshotId } = useSearch({ from: "/(app)/dashboard/setup" });
  const [selectedChart, setSelectedChart] = useState<
    "r-multiple" | "emotion" | "progression"
  >("r-multiple");

  // Preload all progression charts for all snapshotIds
  usePreloadProgressionCharts(tradeSetupId);

  return (
    <div className="grid grid-cols-2 gap-2">
      <Card className="bg-transparent">
        <CardHeader className="flex flex-row items-center justify-between">
          <Tabs
            value={selectedChart}
            onValueChange={(value) =>
              setSelectedChart(
                value as "r-multiple" | "emotion" | "progression"
              )
            }
          >
            <TabsList className="h-7">
              <TabsTrigger value="r-multiple" className="text-xs px-2.5">
                R-Multiple
              </TabsTrigger>
              <TabsTrigger value="progression" className="text-xs px-2.5">
                Progression
              </TabsTrigger>
              <TabsTrigger value="emotion" className="text-xs px-2.5">
                Emotion
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {selectedChart === "r-multiple" && <EvolutionLegend />}
        </CardHeader>
        <CardContent className="">
          {selectedChart === "r-multiple" ? (
            <Chart chartType="r-multiple-evolution" props={{ tradeSetupId }} />
          ) : selectedChart === "progression" ? (
            <Chart
              chartType="progression"
              props={{
                tradeSetupId,
                snapshotId: snapshotId as Id<"snapshots"> | undefined,
              }}
            />
          ) : (
            <Chart chartType="emotion" props={{}} />
          )}
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
