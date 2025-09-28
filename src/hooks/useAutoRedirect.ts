import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useGetToBeOnboardedImages } from "./tradingview_images/use-get-to-be-onboarded-images";

/**
 * Hook that automatically redirects users to the trade onboarding flow
 * when there are images that need to be onboarded, unless they're already
 * in the onboarding flow.
 */
export const useAutoRedirect = () => {
  const { data: images, isLoading } = useGetToBeOnboardedImages({});
  const location = useLocation();
  const navigate = useNavigate();

  // Memoize the redirect data to avoid unnecessary re-renders
  const redirectData = useMemo(() => {
    if (isLoading || !images) return { shouldRedirect: false, imageId: null };

    const hasImagesToOnboard = images.length > 0;
    const isNotOnOnboardingRoute =
      !location.pathname.startsWith("/trade_onboarding");

    const shouldRedirect = hasImagesToOnboard && isNotOnOnboardingRoute;
    // Get the first image ID (since images are ordered by uploadedAt desc, this gets the latest)
    const imageId = images.length > 0 ? images[0]._id : null;

    return { shouldRedirect, imageId };
  }, [images, isLoading, location.pathname]);

  useEffect(() => {
    if (redirectData.shouldRedirect && redirectData.imageId) {
      navigate({
        to: "/trade_onboarding",
        search: {
          imageId: redirectData.imageId,
          onboarding: true,
        },
        // Add replace: true to avoid adding to history stack for better UX
        replace: true,
      });
    }
  }, [redirectData, navigate]);

  // Return useful state for debugging or conditional rendering
  return {
    isLoading,
    hasImagesToOnboard: Boolean(images?.length),
    shouldRedirect: redirectData.shouldRedirect,
    imageId: redirectData.imageId,
  };
};
