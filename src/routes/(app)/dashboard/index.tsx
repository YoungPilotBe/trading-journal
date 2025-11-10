import DashboardPortal from "@/components/portals/dashboard-portal";
import TradeSetupHeader from "@/components/trade-setup-header";
import TradingJournal from "@/components/trading-journal";
import { Separator } from "@/components/ui/separator";
import Portal from "@/portals/portal";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/(app)/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Portal children={<DashboardPortal />} />
      <TradeSetupHeader />
      <Separator
        className="my-5"
        leftText="Active Trades"
        rightTextClassName="text-[10px] text-white"
        leftTextClassName="text-[10px] text-white"
        rightText={
          <Link
            className="flex flex-row gap-2 items-center"
            to={"/dashboard/setups"}
            search={{ status: ["idea", "watching", "executed", "closed"] }}
          >
            All Trades
            <ChevronRight className="size-2" />
          </Link>
        }
      />
      <TradingJournal
        pageSize={10}
        status={["idea", "watching", "executed", "closed"]}
      />
      <Separator
        className="my-5"
        text="Completed Trades"
        textPosition="left"
        textClassName="text-[10px] text-white"
      />
    </>
  );
}
