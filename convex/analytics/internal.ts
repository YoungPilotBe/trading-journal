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
  snapshotId?: Id<"snapshots">; // ID of the comparison snapshot (matches tradeSetupId when filtering by status)
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

    console.log({ tags });

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

  console.log({ extractedTags: tagsByStatus });

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
    // Extract both keys and recursively process values
    Object.entries(obj).forEach(([key, value]) => {
      // Add the key as a tag name
      tags.push(key);

      // If the value is an object or array, recursively extract from it
      if (typeof value === "object" && value !== null) {
        const nestedTags = extractTagsFromObject(value);
        tags.push(...nestedTags);
      }
    });
  }

  console.log(`Final tags extracted from object:`, tags);
  return tags;
}

/**
 * Calculate similarity between two sets of tags using Jaccard similarity
 */
export function calculateTagSetSimilarity(
  tags1: string[],
  tags2: string[]
): number {
  if (tags1.length === 0 && tags2.length === 0) {
    console.log(`    Both tag sets empty -> returning 1.0`);
    return 1.0;
  }
  if (tags1.length === 0 || tags2.length === 0) {
    console.log(`    One tag set empty -> returning 0.0`);
    return 0.0;
  }

  const set1 = new Set(tags1);
  const set2 = new Set(tags2);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  const intersectionArray = Array.from(intersection);
  const unionArray = Array.from(union);
  const similarity = intersection.size / union.size;

  console.log(
    `    Intersection: [${intersectionArray.join(", ")}] (${intersection.size} items)`
  );
  console.log(`    Union: [${unionArray.join(", ")}] (${union.size} items)`);
  console.log(
    `    Jaccard similarity: ${intersection.size}/${union.size} = ${similarity.toFixed(4)}`
  );

  return similarity;
}

/**
 * Calculate similarity between two TagsByStatus objects
 */
export function calculateTagsByStatusSimilarity(
  tagsByStatus1: TagsByStatus,
  tagsByStatus2: TagsByStatus
): number {
  // DEBUG: Log the input data
  console.log("=== DEBUGGING calculateTagsByStatusSimilarity ===");
  console.log("tagsByStatus1:", JSON.stringify(tagsByStatus1, null, 2));
  console.log("tagsByStatus2:", JSON.stringify(tagsByStatus2, null, 2));

  const allStatuses = new Set([
    ...Object.keys(tagsByStatus1),
    ...Object.keys(tagsByStatus2),
  ]);

  console.log("All statuses being compared:", Array.from(allStatuses));

  if (allStatuses.size === 0) {
    console.log("NO MATCHING TAGS SO 0.0");
    return 0.0;
  }

  let totalSimilarity = 0;
  let statusCount = 0;

  console.log("--- Per-status similarity breakdown ---");

  for (const status of allStatuses) {
    const tags1 = tagsByStatus1[status] || [];
    const tags2 = tagsByStatus2[status] || [];

    console.log(`Status "${status}":`);
    console.log(`  Tags1: [${tags1.join(", ")}] (${tags1.length} tags)`);
    console.log(`  Tags2: [${tags2.join(", ")}] (${tags2.length} tags)`);

    const similarity = calculateTagSetSimilarity(tags1, tags2);
    console.log(`  Similarity: ${similarity.toFixed(4)}`);

    totalSimilarity += similarity;
    statusCount++;
  }

  const finalScore = totalSimilarity / statusCount;
  console.log("--- Final Results ---");
  console.log(`Total similarity: ${totalSimilarity.toFixed(4)}`);
  console.log(`Status count: ${statusCount}`);
  console.log(`Final average score: ${finalScore.toFixed(4)}`);
  console.log("=== END DEBUG ===");

  return finalScore;
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
 * Create a filtered trade setup with only snapshots of a specific status
 */
export function filterTradeSetupByStatus(
  tradeSetup: TradeSetupWithSnapshots,
  status: string
): TradeSetupWithSnapshots | null {
  const filteredSnapshots = tradeSetup.snapshots.filter(
    (snapshot) => snapshot.status === status
  );

  // If no snapshots with the specified status, return null
  if (filteredSnapshots.length === 0) {
    return null;
  }

  return {
    ...tradeSetup,
    snapshots: filteredSnapshots,
  };
}

/**
 * Calculate similarity between snapshots of specific status
 */
export function calculateSnapshotStatusSimilarity(
  tradeSetup1: TradeSetupWithSnapshots,
  tradeSetup2: TradeSetupWithSnapshots,
  status: string,
  customWeights?: SimilarityWeights
): SimilarityScore | null {
  // Filter both trade setups to only include snapshots with the specified status
  const filteredTradeSetup1 = filterTradeSetupByStatus(tradeSetup1, status);
  const filteredTradeSetup2 = filterTradeSetupByStatus(tradeSetup2, status);

  // If either trade setup has no snapshots with the specified status, return null
  if (!filteredTradeSetup1 || !filteredTradeSetup2) {
    return null;
  }

  // Use the existing similarity calculation with filtered snapshots
  const similarity = calculateTradeSetupSimilarity(
    filteredTradeSetup1,
    filteredTradeSetup2,
    customWeights
  );

  // Add the comparison snapshot ID (from the first filtered snapshot of tradeSetup2)
  // This ensures snapshotId matches the tradeSetupId in the similarity result
  return {
    ...similarity,
    snapshotId: filteredTradeSetup2.snapshots[0]._id,
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
