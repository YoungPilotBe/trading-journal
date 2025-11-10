import DotGrid from "@/components/dot-grid";
import { AnimatedImageLayout } from "@/components/layouts/AnimatedImageLayout";
import { Button } from "@/components/ui/button";
import { pageVariants } from "@/config/pageVariants";
import { useGetImage } from "@/hooks/tradingview_images/get_image";
import { useDeleteImage } from "@/hooks/tradingview_images/use-delete-image";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
const searchSchema = z.object({
  imageId: z.optional(
    z.custom<Id<"tradingview_images">>((val) => typeof val === "string")
  ),
  onboarding: z.optional(z.boolean()),
});

export const Route = createFileRoute("/trade_onboarding")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function RouteComponent() {
  const { imageId, onboarding } = Route.useSearch();
  const { data, isLoading } = useGetImage({
    id: imageId as Id<"tradingview_images">,
  });
  const navigate = useNavigate();

  const { mutateAsync: deleteImage } = useDeleteImage();

  const handleCancel = async () => {
    await deleteImage({ id: imageId as Id<"tradingview_images"> });
    await navigate({ to: "/dashboard" });
  };

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
        imageId={imageId as Id<"tradingview_images">}
        src={data.url}
        asset={data.asset}
        alt={data.fileName || "Trading screenshot"}
        pageVariants={pageVariants}
        className="mb-8"
      />
      {onboarding && (
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="absolute bottom-40 left-1/2 -translate-x-1/2 starting:opacity-0 starting:translate-y-5 transition-all opacity-100 delay-[1500] duration-500 text-muted-foreground font-mono font-normal tracking-wide"
        >
          Cancel
        </Button>
      )}

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
