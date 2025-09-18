/**
 * Analytics Configuration Utilities
 *
 * Helper functions to manage and switch between different analytics configurations
 */

import {
  AnalyticsConfig,
  BALANCED_CONFIG,
  DEFAULT_ANALYTICS_CONFIG,
  EXECUTION_FOCUSED_CONFIG,
  normalizeSimilarityWeights,
  SimilarityWeights,
  STRATEGY_FOCUSED_CONFIG,
  validateSimilarityWeights,
} from "@/config/analytics";

export type ConfigPreset =
  | "default"
  | "execution-focused"
  | "strategy-focused"
  | "balanced"
  | "custom";

/**
 * Get a configuration preset by name
 */
export function getConfigPreset(preset: ConfigPreset): AnalyticsConfig {
  switch (preset) {
    case "default":
      return DEFAULT_ANALYTICS_CONFIG;
    case "execution-focused":
      return EXECUTION_FOCUSED_CONFIG;
    case "strategy-focused":
      return STRATEGY_FOCUSED_CONFIG;
    case "balanced":
      return BALANCED_CONFIG;
    case "custom":
      return DEFAULT_ANALYTICS_CONFIG; // Fallback to default for custom
    default:
      return DEFAULT_ANALYTICS_CONFIG;
  }
}

/**
 * Create a custom configuration with validation
 */
export function createCustomConfig(
  weights: SimilarityWeights,
  options?: {
    minSimilarityScore?: number;
    limit?: number;
    enabledFactors?: {
      tagsPerStatus?: boolean;
      template?: boolean;
      asset?: boolean;
    };
  }
): AnalyticsConfig {
  // Validate and normalize weights
  const isValid = validateSimilarityWeights(weights);
  const normalizedWeights = isValid
    ? weights
    : normalizeSimilarityWeights(weights);

  if (!isValid) {
    console.warn(
      "Similarity weights don't sum to 1.0, normalizing automatically:",
      {
        original: weights,
        normalized: normalizedWeights,
      }
    );
  }

  return {
    similarityWeights: normalizedWeights,
    defaultMinSimilarityScore: options?.minSimilarityScore ?? 0.1,
    defaultLimit: options?.limit ?? 10,
    enabledFactors: {
      tagsPerStatus: options?.enabledFactors?.tagsPerStatus ?? true,
      template: options?.enabledFactors?.template ?? true,
      asset: options?.enabledFactors?.asset ?? true,
    },
  };
}

/**
 * Get a description of what each preset focuses on
 */
export function getPresetDescription(preset: ConfigPreset): string {
  switch (preset) {
    case "default":
      return "Balanced approach with emphasis on execution patterns (50%), strategy (30%), and asset context (20%)";
    case "execution-focused":
      return "Heavy focus on how trades were executed (70%) and strategy used (30%), ignoring asset differences";
    case "strategy-focused":
      return "Prioritizes trading strategy (50%) over execution details (30%), with some asset context (20%)";
    case "balanced":
      return "Equal weighting across all similarity factors (~33% each)";
    case "custom":
      return "User-defined custom configuration";
    default:
      return "Unknown preset";
  }
}

/**
 * Get the weights for a specific preset
 */
export function getPresetWeights(preset: ConfigPreset): SimilarityWeights {
  return getConfigPreset(preset).similarityWeights;
}

/**
 * Compare two configurations and return the differences
 */
export function compareConfigs(
  config1: AnalyticsConfig,
  config2: AnalyticsConfig
): {
  weightsDiff: {
    tagsPerStatus: number;
    template: number;
    asset: number;
  };
  settingsDiff: {
    minSimilarityScore: number;
    limit: number;
  };
  factorsDiff: {
    tagsPerStatus: boolean;
    template: boolean;
    asset: boolean;
  };
} {
  return {
    weightsDiff: {
      tagsPerStatus:
        config2.similarityWeights.tagsPerStatus -
        config1.similarityWeights.tagsPerStatus,
      template:
        config2.similarityWeights.template - config1.similarityWeights.template,
      asset: config2.similarityWeights.asset - config1.similarityWeights.asset,
    },
    settingsDiff: {
      minSimilarityScore:
        config2.defaultMinSimilarityScore - config1.defaultMinSimilarityScore,
      limit: config2.defaultLimit - config1.defaultLimit,
    },
    factorsDiff: {
      tagsPerStatus:
        config2.enabledFactors.tagsPerStatus !==
        config1.enabledFactors.tagsPerStatus,
      template:
        config2.enabledFactors.template !== config1.enabledFactors.template,
      asset: config2.enabledFactors.asset !== config1.enabledFactors.asset,
    },
  };
}

/**
 * Format similarity weights as percentages for display
 */
export function formatWeightsAsPercentages(weights: SimilarityWeights): {
  tagsPerStatus: string;
  template: string;
  asset: string;
} {
  return {
    tagsPerStatus: `${Math.round(weights.tagsPerStatus * 100)}%`,
    template: `${Math.round(weights.template * 100)}%`,
    asset: `${Math.round(weights.asset * 100)}%`,
  };
}
