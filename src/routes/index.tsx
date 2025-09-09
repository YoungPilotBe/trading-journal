import DotGrid from "@/components/dot-grid";
import { Button } from "@/components/ui/button";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate({ from: "/" });

  return (
    <main className="absolute inset-0">
      <DotGrid
        dotSize={3}
        gap={20}
        proximity={120}
        shockRadius={250}
        shockStrength={5}
        resistance={750}
        returnDuration={1.5}
        baseColor="#1c1917"
        activeColor={"#ffffff"}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Button
          className="relative duration-500 ease-out font-mono tracking-wide leading-3"
          onClick={() => navigate({ to: "/trade-cards", viewTransition: true })}
        >
          Proceed
        </Button>
      </div>
    </main>
  );
}
