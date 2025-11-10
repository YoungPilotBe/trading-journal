import DashboardPortal from "@/components/portals/dashboard-portal";
import TradeSetupHeader from "@/components/trade-setup-header";
import TradingJournal from "@/components/trading-journal";
import { Separator } from "@/components/ui/separator";
import Portal from "@/portals/portal";
import { createFileRoute } from "@tanstack/react-router";

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
        text="Active Trades"
        textPosition="left"
        textClassName="text-[10px] text-white"
      />
      <TradingJournal status={["idea", "watching", "executed", "closed"]} />
      <Separator
        className="my-5"
        text="Completed Trades"
        textPosition="left"
        textClassName="text-[10px] text-white"
      />
      <TradingJournal status={["canceled", "reviewed"]} />
    </>
  );
}
