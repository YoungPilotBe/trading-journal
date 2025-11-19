/**
 * Chart color constants
 * Defines color schemes for different chart types
 */

export const EMOTION_CHART_COLORS = {
  primary: "#3b82f6", // Blue
  secondary: "#8b5cf6", // Purple
} as const;

export const TEMPLATE_CHART_COLORS = {
  primary: "#10b981", // Green
  secondary: "#3b82f6", // Blue
  // Additional colors for pie chart slices
  colors: [
    "#10b981", // Green
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#06b6d4", // Cyan
    "#ec4899", // Pink
    "#84cc16", // Lime
  ],
} as const;

