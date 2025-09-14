import DashboardPortal from "@/components/portals/dashboard-portal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { statusOptions } from "@/config/constants";
import { useGetTradeSetups } from "@/hooks/trade-setup/use-get-trade-setups";
import NavbarPortal from "@/portals/navbar_portal";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading } = useGetTradeSetups({ limit: 4 });

  if (isLoading) {
    return (
      <div className="w-full flex gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="flex-1 animate-pulse h-28 bg-background">
            <CardContent className="h-full bg-muted/20 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <NavbarPortal children={<DashboardPortal />} />
      <div className="w-full flex gap-4">
        {data?.map((setup) => (
          <Link key={setup._id} to="/" className="flex-1 group">
            <Card className="h-28 bg-background border-2 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 group-hover:bg-accent/5">
              <CardContent className="p-4 h-full flex flex-col justify-center">
                <div className="space-y-3">
                  {/* Asset */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg tracking-tight">
                      {setup.asset}
                    </span>
                    {/* Direction Badge */}
                    <Badge
                      variant={
                        setup.direction === "long" ? "default" : "destructive"
                      }
                      className="capitalize text-xs px-2 py-1 font-semibold"
                    >
                      {setup.direction}
                    </Badge>
                  </div>

                  {/* Trade Template */}
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Template:</span>{" "}
                    <span className="font-mono">
                      {setup.tradeTemplateData?.title}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex justify-between items-center">
                    <button
                      key={setup.status}
                      type="button"
                      className={`px-1 py-0.5 border font-mono text-xs rounded-sm transition-all cursor-pointer ${
                        statusOptions.find(
                          (option) => option.value === setup.status
                        )?.color ||
                        "border-gray-400/70 bg-gray-500/5 text-gray-300/80"
                      }`}
                    >
                      {setup.status}
                    </button>
                    <div className="text-xs text-muted-foreground font-mono">
                      {new Date(setup.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
