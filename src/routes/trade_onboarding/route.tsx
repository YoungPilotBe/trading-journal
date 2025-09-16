import DotGrid from "@/components/dot-grid";
import { AnimatedImageLayout } from "@/components/layouts/AnimatedImageLayout";
import { Button } from "@/components/ui/button";
import { pageVariants } from "@/config/pageVariants";
import { useGetImage } from "@/hooks/tradingview_images/get_image";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
const searchSchema = z.object({
  imageId: z.string(),
});

export const Route = createFileRoute("/trade_onboarding")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function RouteComponent() {
  const { imageId } = Route.useSearch();
  const { data, isLoading } = useGetImage({ id: imageId });

  // Early returns for loading and error states
  if (isLoading) {
    return <LoadingState />;
  }

  if (!data?.url) {
    return <ErrorState />;
  }
  return (
    <div className="relative min-h-screen">
      {/* Background dot grid */}
      <div className="absolute inset-0 pointer-events-none">
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
          opacity={0.3}
        />
      </div>

      {/* Content overlay */}
      <AnimatedImageLayout
        imageId={imageId}
        src={data.url}
        asset={data.asset}
        alt={data.fileName || "Trading screenshot"}
        pageVariants={pageVariants}
        className="mb-8"
      />

      <Outlet />
    </div>
  );
}

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      <p className="text-slate-500">Loading image...</p>
    </div>
  </div>
);

const ErrorState = () => {
  const navigate = useNavigate({ from: "/" });

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500 text-lg">
        <Button
          className="relative duration-500 ease-out font-mono tracking-wide leading-3"
          onClick={() => navigate({ to: "/dashboard", viewTransition: true })}
        >
          <ChevronLeft className="size-3" />
          Return to Dashboard
        </Button>
      </p>
    </div>
  );
};
