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
export type ChartType =
  | "emotion"
  | "r-multiple"
  | "r-multiple-evolution"
  | "progression";

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
  tpslEntryId?: Id<"tpsl_entries">; // ID of the TP/SL entry (if applicable) - single entry case
  type: "tp" | "sl" | "start"; // type of point
  isHit: boolean; // whether this TP/SL was actually hit
  isGhost: boolean; // true for ghost paths, false for actual hits
  snapshotId?: Id<"snapshots">; // snapshot ID if applicable
  isLastPoint?: boolean; // true if this is the last point (position fully closed)
  margin?: number; // margin percentage for TP/SL entries (not present for start points) - single entry case
  entryIndex?: number; // index of TP/SL entry (1-based) for labeling (TP1, TP2, etc.) - single entry case
  // Multiple entries support (when multiple entries are hit in the same snapshot)
  tpslEntryIds?: Id<"tpsl_entries">[]; // array of entry IDs when multiple entries are combined
  margins?: number[]; // array of margins corresponding to each entry
  entryIndices?: number[]; // array of entry indices for labeling (TP1, TP2, etc.)
  entryTypes?: ("tp" | "sl")[]; // array of types for each entry
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

// Types for progression snapshot results
export interface RMultipleCalculation {
  combination: Id<"tpsl_entries">[];
  rMultiple: number;
  weightedProfit: number;
  weightedRisk: number;
  totalWeight: number;
}

export interface HitMarker {
  entryId: Id<"tpsl_entries">;
  hitSnapshotId: Id<"snapshots">;
  hitAt: number;
  rMultiple: number;
}

export interface BlockedMarker {
  entryId: Id<"tpsl_entries">;
  reason: "hit_in_previous_snapshot";
  hitSnapshotId: Id<"snapshots">;
  hitAt: number;
  blockedAtSnapshotId: Id<"snapshots">;
}

export interface ProgressionSnapshotResult {
  snapshotId: Id<"snapshots">;
  index: number;
  entryPrice: number | undefined;
  createdAt: number;
  tpslEntries: Array<{
    id: Id<"tpsl_entries">;
    type: "take_profit" | "stop_loss";
    price: number;
    margin: number;
    isHit: boolean;
    hitSnapshotId: Id<"snapshots"> | undefined;
    hitAt: number | undefined;
    isBlocked: boolean;
    blockedReason?: BlockedMarker["reason"];
  }>;
  rMultiples: RMultipleCalculation[];
  hitMarkers: HitMarker[];
  blockedMarkers: BlockedMarker[];
  remainingWeight: number;
}

export interface ProgressionChartResponse {
  snapshots: ProgressionSnapshotResult[];
  chartPaths: ProgressionChartData[];
  chartConfig: LineChartConfig;
  chartColors: EvolutionChartColors;
  direction: "long" | "short";
  currentSnapshotId: Id<"snapshots"> | undefined;
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
              snapshots: ProgressionSnapshotResult[] | null;
              currentSnapshotId: Id<"snapshots"> | null | undefined;
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
