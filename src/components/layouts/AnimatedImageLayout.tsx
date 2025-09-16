import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type PageVariants } from "@/types/animations";
import { useConvexMutation } from "@convex-dev/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { motion } from "framer-motion";
import { forwardRef, useCallback, useState } from "react";
import { api } from "../../../convex/_generated/api";

interface AnimatedImageLayoutProps {
  imageId: string;
  src: string;
  asset: string;
  alt: string;
  children?: React.ReactNode;
  pageVariants?: PageVariants;
  className?: string;
  imageClassName?: string;
  layoutId?: string;
}

const useImageAnimation = (pageVariants: PageVariants) => {
  const location = useLocation();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get target position for current page
  const getCurrentTarget = useCallback(() => {
    const currentPath = location.pathname;
    const pageConfig = pageVariants[currentPath] || {};
    return pageConfig.target || {};
  }, [location.pathname, pageVariants]);

  const onImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Check if we're on the root trade_onboarding page (show buttons only here)
  const isRootPage = location.pathname === "/trade_onboarding";

  return {
    imageLoaded,
    onImageLoad,
    getCurrentTarget,
    isRootPage,
    searchParams: location.search,
  };
};

export const AnimatedImageLayout = forwardRef<
  HTMLDivElement,
  AnimatedImageLayoutProps
>(
  (
    {
      imageId,
      src,
      asset,
      alt,
      children,
      pageVariants = {},
      className = "",
      imageClassName = "",
      layoutId = "trading-image",
    },
    ref
  ) => {
    const {
      imageLoaded,
      onImageLoad,
      getCurrentTarget,
      isRootPage,
      searchParams,
    } = useImageAnimation(pageVariants);
    const navigate = useNavigate();
    const deleteImage = useConvexMutation(api.tradingview_images.deleteImage);

    const targetStyle = getCurrentTarget();

    // Navigation handlers
    const handleAddTradeClick = useCallback(() => {
      if (searchParams?.imageId) {
        navigate({
          to: "/trade_onboarding/add_trade",
          search: { imageId: searchParams.imageId },
        });
      }
    }, [navigate, searchParams]);

    const handleAttachTradeClick = useCallback(() => {
      if (searchParams?.imageId) {
        navigate({
          to: "/trade_onboarding/attach_trade",
          search: { imageId: searchParams.imageId, asset },
        });
      }
    }, [asset, navigate, searchParams.imageId]);

    const handleCancel = async () => {
      await deleteImage({ id: imageId as Id<"tradingview_images"> });
      await navigate({ to: "/dashboard" });
    };

    return (
      <>
        <div
          ref={ref}
          className={`absolute inset-0 flex flex-col items-center justify-center ${className}`}
          style={{ perspective: "1000px" }}
        >
          <motion.div
            className="relative animated-image-container group overflow-hidden rounded-2xl"
            layoutId={layoutId}
            animate={targetStyle}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            style={{
              transformOrigin: "center center",
            }}
          >
            <motion.img
              src={src}
              alt={alt}
              className={cn(
                `object-contain rounded-2xl w-full h-auto max-w-[90vw] max-h-[60vh] sm:max-w-[80vw] sm:max-h-[70vh] lg:max-w-6xl lg:max-h-[80vh] transition-all duration-200 ${imageClassName}`,
                isRootPage && " group-hover:blur-xs"
              )}
              onLoad={onImageLoad}
              initial={{ opacity: 0 }}
              animate={{
                opacity: imageLoaded ? 1 : 0,
              }}
              transition={{
                opacity: { duration: 0.3 },
              }}
              style={{
                transformOrigin: "center center",
              }}
            />

            {/* Hover Overlay with Buttons - Only show on root page */}
            {isRootPage && (
              <>
                <div className="absolute inset-0 flex flex-row rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto p-2 gap-2">
                  {/* Add Trade Button - Left Half */}
                  <Button
                    size="lg"
                    className="flex-1 h-full flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer text-white bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 shadow-xl px-10 py-4 text-xl font-bold transform "
                    onClick={handleAddTradeClick}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    Add Trade
                  </Button>

                  {/* Attach Trade Button - Right Half */}
                  <Button
                    size="lg"
                    className="flex-1 h-full flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer text-white bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 shadow-xl px-10 py-4 text-xl font-bold transform "
                    onClick={handleAttachTradeClick}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    Attach Trade
                  </Button>
                </div>
              </>
            )}
          </motion.div>

          {children}
        </div>
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="absolute bottom-40 left-1/2 -translate-x-1/2 starting:opacity-0 starting:translate-y-5 transition-all opacity-100 delay-[1500] duration-500 text-muted-foreground font-mono font-normal tracking-wide"
        >
          Cancel
        </Button>
      </>
    );
  }
);

AnimatedImageLayout.displayName = "AnimatedImageLayout";
