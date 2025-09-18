// Note: Using built-in similarity calculations instead of external libraries for now
import { Doc, Id } from "../_generated/dataModel";
import { DatabaseReader } from "../_generated/server";
import { getAnalyticsConfig, SimilarityWeights } from "../config/analytics";

// Types for our similarity calculations
export type TradeSetupWithSnapshots = Doc<"trade_setups"> & {
  snapshots: Doc<"snapshots">[];
};

export type SimilarityScore = {
  tradeSetupId: Id<"trade_setups">;
  similarityScore: number;
  breakdown: {
    tagsPerStatusSimilarity: number;
    templateSimilarity: number;
    assetSimilarity: number;
    overallScore: number;
  };
};

export type TagsByStatus = {
  [status: string]: string[];
};

/**
 * Extract tags grouped by status from snapshots
 */
export function extractTagsByStatus(
  snapshots: Doc<"snapshots">[]
): TagsByStatus {
  const tagsByStatus: TagsByStatus = {};

  for (const snapshot of snapshots) {
    const status = snapshot.status;
    const tags = snapshot.tags || [];

    if (!tagsByStatus[status]) {
      tagsByStatus[status] = [];
    }

    // Extract tag names from the tags structure
    if (Array.isArray(tags)) {
      tagsByStatus[status] = [...tagsByStatus[status], ...tags];
    } else if (typeof tags === "object" && tags !== null) {
      // Handle nested tag structure if it exists
      const extractedTags = extractTagsFromObject(tags);
      tagsByStatus[status] = [...tagsByStatus[status], ...extractedTags];
    }
  }

  // Remove duplicates within each status
  Object.keys(tagsByStatus).forEach((status) => {
    tagsByStatus[status] = [...new Set(tagsByStatus[status])];
  });

  return tagsByStatus;
}

/**
 * Recursively extract tag names from nested tag objects
 */
function extractTagsFromObject(obj: unknown): string[] {
  const tags: string[] = [];

  if (typeof obj === "string") {
    tags.push(obj);
  } else if (Array.isArray(obj)) {
    obj.forEach((item) => {
      tags.push(...extractTagsFromObject(item));
    });
  } else if (typeof obj === "object" && obj !== null) {
    Object.values(obj).forEach((value) => {
      tags.push(...extractTagsFromObject(value));
    });
  }

  return tags;
}

/**
 * Calculate similarity between two sets of tags using Jaccard similarity
 */
export function calculateTagSetSimilarity(
  tags1: string[],
  tags2: string[]
): number {
  if (tags1.length === 0 && tags2.length === 0) return 1.0;
  if (tags1.length === 0 || tags2.length === 0) return 0.0;

  const set1 = new Set(tags1);
  const set2 = new Set(tags2);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Calculate similarity between two TagsByStatus objects
 */
export function calculateTagsByStatusSimilarity(
  tagsByStatus1: TagsByStatus,
  tagsByStatus2: TagsByStatus
): number {
  const allStatuses = new Set([
    ...Object.keys(tagsByStatus1),
    ...Object.keys(tagsByStatus2),
  ]);

  if (allStatuses.size === 0) return 1.0;

  let totalSimilarity = 0;
  let statusCount = 0;

  for (const status of allStatuses) {
    const tags1 = tagsByStatus1[status] || [];
    const tags2 = tagsByStatus2[status] || [];

    const similarity = calculateTagSetSimilarity(tags1, tags2);
    totalSimilarity += similarity;
    statusCount++;
  }

  return totalSimilarity / statusCount;
}

/**
 * Calculate template similarity (exact match for now, can be enhanced)
 */
export function calculateTemplateSimilarity(
  template1: Id<"trade_templates"> | undefined,
  template2: Id<"trade_templates"> | undefined
): number {
  if (!template1 && !template2) return 1.0;
  if (!template1 || !template2) return 0.0;
  return template1 === template2 ? 1.0 : 0.0;
}

/**
 * Calculate asset similarity (exact match for same asset, 0 for different)
 */
export function calculateAssetSimilarity(
  asset1: string,
  asset2: string
): number {
  return asset1.toLowerCase() === asset2.toLowerCase() ? 1.0 : 0.0;
}

/**
 * Calculate overall similarity between two trade setups
 */
export function calculateTradeSetupSimilarity(
  tradeSetup1: TradeSetupWithSnapshots,
  tradeSetup2: TradeSetupWithSnapshots,
  customWeights?: SimilarityWeights
): SimilarityScore {
  // Get configuration (use custom weights if provided, otherwise use default config)
  const config = getAnalyticsConfig();
  const weights = customWeights || config.similarityWeights;

  // Extract tags by status for both trade setups
  const tagsByStatus1 = extractTagsByStatus(tradeSetup1.snapshots);
  const tagsByStatus2 = extractTagsByStatus(tradeSetup2.snapshots);

  // Calculate individual similarity scores
  const tagsPerStatusSimilarity = config.enabledFactors.tagsPerStatus
    ? calculateTagsByStatusSimilarity(tagsByStatus1, tagsByStatus2)
    : 0;

  const templateSimilarity = config.enabledFactors.template
    ? calculateTemplateSimilarity(
        tradeSetup1.trade_template,
        tradeSetup2.trade_template
      )
    : 0;

  const assetSimilarity = config.enabledFactors.asset
    ? calculateAssetSimilarity(tradeSetup1.asset, tradeSetup2.asset)
    : 0;

  // Calculate weighted overall score using configuration
  const overallScore =
    tagsPerStatusSimilarity * weights.tagsPerStatus +
    templateSimilarity * weights.template +
    assetSimilarity * weights.asset;

  return {
    tradeSetupId: tradeSetup2._id,
    similarityScore: overallScore,
    breakdown: {
      tagsPerStatusSimilarity,
      templateSimilarity,
      assetSimilarity,
      overallScore,
    },
  };
}

/**
 * Fetch trade setup with all its snapshots
 */
export async function fetchTradeSetupWithSnapshots(
  db: DatabaseReader,
  tradeSetupId: Id<"trade_setups">
): Promise<TradeSetupWithSnapshots | null> {
  const tradeSetup = await db.get(tradeSetupId);
  if (!tradeSetup) return null;

  const snapshots = await db
    .query("snapshots")
    .withIndex("by_trade_setup", (q) => q.eq("tradeSetupId", tradeSetupId))
    .order("asc")
    .collect();

  return {
    ...tradeSetup,
    snapshots,
  };
}

/**
 * Fetch all trade setups with their snapshots (excluding the target)
 */
export async function fetchAllTradeSetupsWithSnapshots(
  db: DatabaseReader,
  excludeId: Id<"trade_setups">
): Promise<TradeSetupWithSnapshots[]> {
  const allTradeSetups = await db
    .query("trade_setups")
    .filter((q) => q.neq(q.field("_id"), excludeId))
    .collect();

  const tradeSetupsWithSnapshots: TradeSetupWithSnapshots[] = [];

  for (const tradeSetup of allTradeSetups) {
    const snapshots = await db
      .query("snapshots")
      .withIndex("by_trade_setup", (q) => q.eq("tradeSetupId", tradeSetup._id))
      .order("asc")
      .collect();

    tradeSetupsWithSnapshots.push({
      ...tradeSetup,
      snapshots,
    });
  }

  return tradeSetupsWithSnapshots;
}
