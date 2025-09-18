/**
 * Server-side Analytics Configuration for Convex
 *
 * This file contains the same configuration as the client-side config
 * but is accessible within Convex functions.
 */

export interface SimilarityWeights {
  /** Weight for tags per status similarity (0-1) */
  tagsPerStatus: number;
  /** Weight for template similarity (0-1) */
  template: number;
  /** Weight for asset similarity (0-1) */
  asset: number;
}

export interface AnalyticsConfig {
  /** Similarity calculation weights - should sum to 1.0 for best results */
  similarityWeights: SimilarityWeights;
  /** Default minimum similarity score threshold */
  defaultMinSimilarityScore: number;
  /** Default limit for similar trades results */
  defaultLimit: number;
  /** Enable/disable different similarity factors */
  enabledFactors: {
    tagsPerStatus: boolean;
    template: boolean;
    asset: boolean;
  };
}

/**
 * Default Analytics Configuration
 *
 * Weights explanation:
 * - tagsPerStatus (0.5): Highest weight because execution patterns and trading decisions
 *   at different stages are the most important indicator of similarity
 * - template (0.3): Medium weight because strategy choice is important but can be
 *   adapted across different market conditions
 * - asset (0.2): Lowest weight because good strategies often work across multiple assets,
 *   but same-asset trades still have some correlation value
 */
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  similarityWeights: {
    tagsPerStatus: 0.5, // 50% - Most important: How similar are the trading decisions?
    template: 0.3, // 30% - Important: Same core strategy?
    asset: 0.2, // 20% - Context: Same market conditions?
  },
  defaultMinSimilarityScore: 0.1, // 10% minimum similarity to show results
  defaultLimit: 10, // Show top 10 similar trades by default
  enabledFactors: {
    tagsPerStatus: true,
    template: true,
    asset: true,
  },
};

/**
 * Alternative Configuration Presets
 */

/** Focus heavily on execution patterns, ignore asset differences */
export const EXECUTION_FOCUSED_CONFIG: AnalyticsConfig = {
  similarityWeights: {
    tagsPerStatus: 0.7, // 70% - Heavy focus on execution
    template: 0.3, // 30% - Strategy matters
    asset: 0.0, // 0% - Asset doesn't matter
  },
  defaultMinSimilarityScore: 0.15,
  defaultLimit: 8,
  enabledFactors: {
    tagsPerStatus: true,
    template: true,
    asset: false,
  },
};

/** Focus on strategy and asset, less on specific execution details */
export const STRATEGY_FOCUSED_CONFIG: AnalyticsConfig = {
  similarityWeights: {
    tagsPerStatus: 0.3, // 30% - Less focus on execution details
    template: 0.5, // 50% - Strategy is most important
    asset: 0.2, // 20% - Asset context matters
  },
  defaultMinSimilarityScore: 0.2,
  defaultLimit: 12,
  enabledFactors: {
    tagsPerStatus: true,
    template: true,
    asset: true,
  },
};

/** Equal weighting for all factors */
export const BALANCED_CONFIG: AnalyticsConfig = {
  similarityWeights: {
    tagsPerStatus: 0.33, // 33% - Equal weight
    template: 0.33, // 33% - Equal weight
    asset: 0.34, // 34% - Equal weight (rounds to 1.0)
  },
  defaultMinSimilarityScore: 0.1,
  defaultLimit: 10,
  enabledFactors: {
    tagsPerStatus: true,
    template: true,
    asset: true,
  },
};

/**
 * Get the current analytics configuration
 * This is the server-side version that Convex functions will use
 */
export function getAnalyticsConfig(): AnalyticsConfig {
  // For now, return the default config
  // In the future, you could:
  // - Load from environment variables
  // - Load from a configuration document in the database
  // - Allow per-user configuration

  return DEFAULT_ANALYTICS_CONFIG;

  // Examples of how you might switch configs:
  // return EXECUTION_FOCUSED_CONFIG;
  // return STRATEGY_FOCUSED_CONFIG;
  // return BALANCED_CONFIG;
}

/**
 * Validate that similarity weights sum to approximately 1.0
 */
export function validateSimilarityWeights(weights: SimilarityWeights): boolean {
  const sum = weights.tagsPerStatus + weights.template + weights.asset;
  const tolerance = 0.01; // Allow small floating point differences
  return Math.abs(sum - 1.0) <= tolerance;
}

/**
 * Normalize similarity weights to sum to 1.0
 */
export function normalizeSimilarityWeights(
  weights: SimilarityWeights
): SimilarityWeights {
  const sum = weights.tagsPerStatus + weights.template + weights.asset;

  if (sum === 0) {
    // If all weights are 0, return equal weights
    return { tagsPerStatus: 0.33, template: 0.33, asset: 0.34 };
  }

  return {
    tagsPerStatus: weights.tagsPerStatus / sum,
    template: weights.template / sum,
    asset: weights.asset / sum,
  };
}
