// Page-specific target position configurations
export interface PageVariantConfig {
  target?: {
    x?: number;
    y?: number;
    scale?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    opacity?: number;
  };
}

export interface PageVariants {
  [path: string]: PageVariantConfig;
}

// Default spring transition configuration for smooth animations
export const defaultTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};
