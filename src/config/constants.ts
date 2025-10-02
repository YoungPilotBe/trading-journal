// src/config/constants.ts
import { Doc } from "convex/_generated/dataModel";

export type StatusContext = {
  isNew: boolean;
  currentStatus?: Doc<"snapshots">["status"];
  hasExecutedTrade?: boolean;
  previousStatuses?: Doc<"snapshots">["status"][] | null;
  tradeSetupId?: string;
};

// Define chronological order of statuses
const STATUS_ORDER = [
  "idea",
  "watching",
  "executed",
  "closed",
  "reviewed",
  "canceled", // Special case - can always be selected
] as const;

// Helper function to check if a status should be disabled based on chronological order
const createChronologicalChecker = (
  targetStatus: Doc<"snapshots">["status"]
) => {
  return (context: StatusContext) => {
    // If no current status, allow any status
    if (!context.currentStatus) return false;

    // Special case: canceled can always be selected
    if (targetStatus === "canceled") {
      return false; // Always allowed
    }

    // For all statuses except idea and watching, disable if already selected in previous snapshot
    if (targetStatus !== "idea" && targetStatus !== "watching") {
      if (context.currentStatus === targetStatus) {
        return true; // Disable if the previous snapshot already has this status
      }
    }

    if (context.currentStatus === targetStatus) return false;

    // Get the chronological order indices
    const currentIndex = STATUS_ORDER.indexOf(context.currentStatus!);
    const targetIndex = STATUS_ORDER.indexOf(targetStatus);

    // If we can't find the statuses in the order, allow it
    if (currentIndex === -1 || targetIndex === -1) return false;

    // Can only move forward chronologically, not backward
    if (targetIndex < currentIndex) return true;

    // Special rules for specific statuses
    if (targetStatus === "closed") {
      // Closed requires executed to have happened
      return !context.previousStatuses?.includes("executed");
    }

    if (targetStatus === "reviewed") {
      // Reviewed requires closed to have happened
      return !context.previousStatuses?.includes("closed");
    }

    return false;
  };
};

export const statusOptions: {
  value: Doc<"snapshots">["status"];
  label: string;
  color: string;
  separator?: boolean | string;
  disabled?: (context: StatusContext) => boolean;
}[] = [
  {
    value: "idea",
    label: "Idea",
    color: "border-blue-400/70 bg-blue-500/5 text-blue-300/80",
    disabled: createChronologicalChecker("idea"),
  },
  {
    value: "watching",
    label: "Watching",
    color: "border-yellow-400/70 bg-yellow-500/5 text-yellow-300/80",
    separator: "Phase 1",
    disabled: createChronologicalChecker("watching"),
  },
  {
    value: "executed",
    label: "Executed",
    color: "border-green-400/70 bg-green-500/5 text-green-300/80",
    disabled: createChronologicalChecker("executed"),
  },
  {
    value: "closed",
    label: "Closed",
    color: "border-purple-400/70 bg-purple-500/5 text-purple-300/80",
    separator: "Phase 2",
    disabled: createChronologicalChecker("closed"),
  },
  {
    value: "reviewed",
    label: "Reviewed",
    color: "border-orange-400/70 bg-orange-500/5 text-orange-300/80",
    disabled: createChronologicalChecker("reviewed"),
  },
  {
    value: "canceled",
    label: "Canceled",
    color: "border-pink-400/70 bg-pink-500/5 text-pink-300/80",
    disabled: createChronologicalChecker("canceled"),
  },
] as const;
