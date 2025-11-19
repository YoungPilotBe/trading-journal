/**
 * Chart color constants
 * Defines color schemes aligned with dark-neutral theme
 * Colors are approximate conversions from oklch values in globals.css
 * Dark theme chart colors (primary focus):
 * - chart-1: oklch(0.488 0.243 264.376) ≈ #7c3aed (purple)
 * - chart-2: oklch(0.696 0.17 162.48) ≈ #14b8a6 (teal)
 * - chart-3: oklch(0.769 0.188 70.08) ≈ #f59e0b (amber)
 * - chart-4: oklch(0.627 0.265 303.9) ≈ #a855f7 (purple)
 * - chart-5: oklch(0.645 0.246 16.439) ≈ #f97316 (orange)
 */

export const EMOTION_CHART_COLORS = {
  // Using chart-1 and chart-2 for emotion charts
  primary: "oklch(0.488 0.243 264.376)", // chart-1 dark theme
  secondary: "oklch(0.696 0.17 162.48)", // chart-2 dark theme
} as const;

export const TEMPLATE_CHART_COLORS = {
  primary: "oklch(0.488 0.243 264.376)", // chart-1
  secondary: "oklch(0.696 0.17 162.48)", // chart-2
  // Additional colors for pie chart slices using chart color palette
  colors: [
    "oklch(0.488 0.243 264.376)", // chart-1
    "oklch(0.696 0.17 162.48)", // chart-2
    "oklch(0.769 0.188 70.08)", // chart-3
    "oklch(0.627 0.265 303.9)", // chart-4
    "oklch(0.645 0.246 16.439)", // chart-5
    "oklch(0.488 0.243 264.376)", // chart-1 (cycle back)
    "oklch(0.696 0.17 162.48)", // chart-2
    "oklch(0.769 0.188 70.08)", // chart-3
  ],
} as const;

export const EVOLUTION_CHART_COLORS = {
  primary: "oklch(0.488 0.243 264.376)", // chart-1 dark theme
  secondary: "oklch(0.696 0.17 162.48)", // chart-2 dark theme
  stroke: "oklch(0.488 0.243 264.376)", // line stroke color
  dot: "oklch(0.696 0.17 162.48)", // dot color
} as const;

