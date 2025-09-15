import DashboardPortal from "@/components/portals/dashboard-portal";
import TradeSetupHeader from "@/components/trade-setup-header";
import NavbarPortal from "@/portals/navbar_portal";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <NavbarPortal children={<DashboardPortal />} />
      <TradeSetupHeader />
    </>
  );
}
