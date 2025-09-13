import StatusIndicator from "@/components/status-indicator";
import GlobalHooks from "@/hooks/globalHooks";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useConvexConnectionState } from "convex/react";
export const Route = createFileRoute("/(app)/dashboard")({
  component: LayoutComponent,
});

function LayoutComponent() {
  const { isWebSocketConnected } = useConvexConnectionState();

  return (
    <>
      <GlobalHooks />
      <div className="min-h-screen">
        {/* Navigation Bar */}
        <nav className="shadow-sm border-b border-muted">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-primary">
                  Trading Journal
                </h1>
              </div>
              <div className="flex items-center space-x-8">
                <StatusIndicator
                  isConnected={isWebSocketConnected}
                  server="Convex"
                  description="Server connection to database"
                />
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="mx-5 py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </>
  );
}
