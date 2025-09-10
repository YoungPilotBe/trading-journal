import { Button } from "@/components/ui/button";
import { useGetImage } from "@/hooks/tradingview_images/get_image";
import { createFileRoute } from "@tanstack/react-router";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { z } from "zod";

const searchSchema = z.object({
  imageId: z.string(),
});

export const Route = createFileRoute("/trade_onboarding/reveal_screenshot")({
  validateSearch: searchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { imageId } = Route.useSearch();
  const { data, isLoading } = useGetImage({ id: imageId });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      data?.url &&
      imageRef.current &&
      containerRef.current &&
      buttonsRef.current
    ) {
      // Set initial state for image
      gsap.set(imageRef.current, {
        opacity: 0,
        y: 500,
        rotationX: -50,
        scale: 0.6,
        transformPerspective: 1000,
        transformOrigin: "center center",
      });

      // Buttons are initially hidden via CSS styles

      // Animate in
      gsap.to(imageRef.current, {
        opacity: 1,
        y: 0,
        rotationX: 0,
        scale: 1,
        duration: 1.2,
        ease: "power3.out",
        delay: 0.2,
      });

      // Add subtle floating animation
      const floatingAnimation = gsap.to(imageRef.current, {
        rotationX: -5,
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.5,
      });

      // Click handler for shifting up and reducing size
      const handleClick = () => {
        // Kill the floating animation
        floatingAnimation.kill();

        // Shift up and reduce size
        gsap.to(imageRef.current, {
          y: -100,
          scale: 0.5,
          rotationX: 0, // Reset rotation to flat
          duration: 1,
          ease: "power2.out",
        });

        // Animate buttons in
        if (buttonsRef.current) {
          // Make buttons visible (initial transform states are already set in CSS)
          gsap.set(buttonsRef.current, {
            visibility: "visible",
          });

          // Animate buttons in with stagger (no need to set initial state again)
          gsap.to(buttonsRef.current.children, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "back.out(1.7)",
            stagger: 0.1,
            delay: 0.5, // Start after image animation begins
          });
        }

        // Remove click listener after first click
        document.removeEventListener("click", handleClick);
      };

      // Add click listener after initial animation completes
      const addClickListener = () => {
        document.addEventListener("click", handleClick);
      };

      // Wait for initial animations to complete before enabling click
      setTimeout(addClickListener, 1500);

      // Cleanup function
      return () => {
        document.removeEventListener("click", handleClick);
        floatingAnimation.kill();
      };
    }
  }, [data?.url]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
          <p className="text-slate-500">Loading image...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <p className="text-slate-500 text-lg">Image not found</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ perspective: "1000px" }}
    >
      <div className="relative mb-8">
        <img
          ref={imageRef}
          src={data.url!}
          alt={data.fileName || "Trading screenshot"}
          className="max-w-6xl max-h-[80vh] object-contain rounded-2xl"
          onLoad={() => {
            // Ensure animation triggers even if image loads quickly
            if (imageRef.current) {
              gsap.set(imageRef.current, { visibility: "visible" });
            }
          }}
        />
      </div>

      {/* Action Buttons */}
      <div
        ref={buttonsRef}
        className="flex gap-6 mt-8"
        style={{ visibility: "hidden" }}
      >
        <Button
          size="lg"
          className="px-8 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          style={{ opacity: 0, transform: "translateY(50px) scale(0.8)" }}
        >
          New Trade Idea
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="px-8 py-4 text-lg font-semibold border-2 border-gray-300 hover:border-gray-400 shadow-lg"
          style={{ opacity: 0, transform: "translateY(50px) scale(0.8)" }}
        >
          Attach Image
        </Button>
      </div>
    </div>
  );
}
