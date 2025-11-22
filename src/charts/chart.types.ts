import type { Id } from "../../convex/_generated/dataModel";
import type {
  EMOTION_CHART_COLORS,
  EVOLUTION_CHART_COLORS,
  TEMPLATE_CHART_COLORS,
} from "../../convex/charts/constants";

export type ProgressionChartColors = typeof EVOLUTION_CHART_COLORS;

/**
 * Chart type definitions
 * Uses TypeScript inference and discriminated unions for type safety
 */

// Chart type identifier
export type ChartType = "emotion" | "r-multiple" | "r-multiple-evolution" | "progression";

// Chart configuration types
export type ChartConfigType = "bar" | "pie" | "line";

export interface BaseChartConfig {
  type: ChartConfigType;
  xAxis: string;
  yAxis: string;
}

export interface BarChartConfig extends BaseChartConfig {
  type: "bar";
}

export interface PieChartConfig extends BaseChartConfig {
  type: "pie";
}

export interface LineChartConfig extends BaseChartConfig {
  type: "line";
}

// Chart color types inferred from constants
export type EmotionChartColors = typeof EMOTION_CHART_COLORS;
export type TemplateChartColors = typeof TEMPLATE_CHART_COLORS;
export type EvolutionChartColors = typeof EVOLUTION_CHART_COLORS;

// Chart data types
export interface EmotionChartData {
  emotion: string;
  avgRMultiple: number;
  count: number;
}

export interface TemplateChartData {
  templateId: string;
  templateTitle: string;
  avgRMultiple: number;
  count: number;
  usagePercentage: number;
}

export interface EvolutionChartData {
  snapshotId: Id<"snapshots">;
  index: number;
  rMultiple: number | null;
  status: string;
  createdAt: number;
}

export interface ProgressionChartData {
  x: number; // snapshot index
  y: number; // R-Multiple value
  referencePointId: string; // ID of the reference point this path came from
  tpslEntryId?: Id<"tpsl_entries">; // ID of the TP/SL entry (if applicable)
  type: "tp" | "sl" | "start"; // type of point
  isHit: boolean; // whether this TP/SL was actually hit
  isGhost: boolean; // true for ghost paths, false for actual hits
  snapshotId?: Id<"snapshots">; // snapshot ID if applicable
  isLastPoint?: boolean; // true if this is the last point (position fully closed)
  margin?: number; // margin percentage for TP/SL entries
  entryIndex?: number; // index of TP/SL entry (1-based) for labeling (TP1, TP2, etc.)
}

// Chart response types (what comes from queries)
export interface EmotionChartResponse {
  data: EmotionChartData[];
  chartConfig: BarChartConfig;
  chartColors: EmotionChartColors;
}

export interface TemplateChartResponse {
  data: TemplateChartData[];
  chartConfig: PieChartConfig;
  chartColors: TemplateChartColors;
}

export interface EvolutionChartResponse {
  data: EvolutionChartData[];
  chartConfig: LineChartConfig;
  chartColors: EvolutionChartColors;
}

export interface ProgressionChartResponse {
  data: ProgressionChartData[];
  chartConfig: LineChartConfig;
  chartColors: EvolutionChartColors;
}

// Discriminated union for chart responses
export type ChartResponse =
  | EmotionChartResponse
  | TemplateChartResponse
  | EvolutionChartResponse
  | ProgressionChartResponse;

// Type guards for discriminated union
export function isEmotionChartResponse(
  response: ChartResponse
): response is EmotionChartResponse {
  return response.chartConfig.type === "bar";
}

export function isTemplateChartResponse(
  response: ChartResponse
): response is TemplateChartResponse {
  return response.chartConfig.type === "pie";
}

// Chart props type - defines what props each chart type needs
export type ChartProps<T extends ChartType> = T extends "r-multiple-evolution"
  ? { tradeSetupId: Id<"trade_setups"> }
  : T extends "progression"
    ? { tradeSetupId: Id<"trade_setups">; snapshotId?: Id<"snapshots"> }
    : T extends "r-multiple"
      ? {
          templateId?: Id<"trade_templates">;
          filterType?: "all" | "closed";
          templateView?: "list" | "chart";
        }
      : Record<string, never>;

// Chart context value types (what's stored in context)
// Components can render either bar, pie, or line, so config can be any type
export type ChartContextValue<T extends ChartType = ChartType> =
  T extends "emotion"
    ? {
        data: EmotionChartData[] | null;
        chartConfig: BaseChartConfig | null;
        chartColors: EmotionChartColors | null;
        isLoading: boolean;
        error: unknown;
      }
    : T extends "r-multiple"
      ? {
          data: TemplateChartData[] | null;
          chartConfig: BaseChartConfig | null;
          chartColors: TemplateChartColors | null;
          isLoading: boolean;
          error: unknown;
        }
      : T extends "r-multiple-evolution"
        ? {
            data: EvolutionChartData[] | null;
            chartConfig: BaseChartConfig | null;
            chartColors: EvolutionChartColors | null;
            isLoading: boolean;
            error: unknown;
          }
        : T extends "progression"
          ? {
              data: ProgressionChartData[] | null;
              chartConfig: BaseChartConfig | null;
              chartColors: EvolutionChartColors | null;
              isLoading: boolean;
              error: unknown;
            }
          : never;

// Helper type to extract data type from chart type
export type ChartDataType<T extends ChartType> = T extends "emotion"
  ? EmotionChartData[]
  : TemplateChartData[];

// Helper type to extract config type from chart type
export type ChartConfigTypeFromChartType<T extends ChartType> =
  T extends "emotion" ? BarChartConfig : PieChartConfig;

// Helper type to extract colors type from chart type
export type ChartColorsTypeFromChartType<T extends ChartType> =
  T extends "emotion" ? EmotionChartColors : TemplateChartColors;
