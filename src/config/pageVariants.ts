import type { PageVariants } from "@/types/animations";

// Centralized configuration for page-specific image target positions
// Framer Motion's layout animations handle the transitions automatically
export const pageVariants: PageVariants = {
  // Page 1 - Center position (default/home)
  "/trade_onboarding": {
    target: {
      x: 0,
      y: 0,
      scale: 1,
      rotateX: 5,
      rotateY: 0,
      rotateZ: 0,
    },
  },

  // Page 2 - Left side, scaled down significantly
  "/trade_onboarding/add_trade": {
    target: {
      x: -400,
      y: -100,
      scale: 0.6,
      rotateX: 0,
      rotateY: 5,
      rotateZ: 0,
    },
  },

  // Page 3 - Right side, medium scale
  "/trade_onboarding/page3": {
    target: {
      x: 300,
      y: 50,
      scale: 0.8,
      rotateX: 0,
      rotateY: 10,
      rotateZ: -2,
    },
  },

  // Page 4 - Bottom center, medium scale
  "/trade_onboarding/page4": {
    target: {
      x: 0,
      y: 200,
      scale: 0.6,
      rotateX: 15,
      rotateY: 0,
      rotateZ: 0,
    },
  },

  // Add more pages as needed...
};

// Helper function to get variants for a specific page
export const getPageVariants = (path: string) => {
  return pageVariants[path] || {};
};

// Helper function to add or update page variants
export const updatePageVariants = (
  path: string,
  variants: PageVariants[string]
) => {
  pageVariants[path] = variants;
};

// Responsive breakpoint configurations
export const responsiveConfig = {
  mobile: {
    maxWidth: "90vw",
    maxHeight: "60vh",
  },
  tablet: {
    maxWidth: "80vw",
    maxHeight: "70vh",
  },
  desktop: {
    maxWidth: "6xl", // max-w-6xl
    maxHeight: "80vh",
  },
};

// Helper to get responsive image classes
export const getResponsiveImageClasses = () => {
  return "w-full h-auto max-w-[90vw] max-h-[60vh] sm:max-w-[80vw] sm:max-h-[70vh] lg:max-w-6xl lg:max-h-[80vh]";
};
