import DotGrid from "@/components/dot-grid";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/trade_onboarding")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="relative min-h-screen">
      {/* Background dot grid */}
      <div className="absolute inset-0 z-0">
        <DotGrid
          dotSize={3}
          gap={20}
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
          baseColor="#1c1917"
          activeColor="#ffffff"
          opacity={0.5}
        />
      </div>

      {/* Content overlay */}
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
}
