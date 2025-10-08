import { TIMEFRAMES } from "@/config/timeframe-order";
import { Doc } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { addTimeframeToTimeframes } from "../utils";
import { AddTradeSetupSchema } from "./add-trade-schema";

type Timeframe = (typeof TIMEFRAMES)[number];

// Type for the existing values data
interface ExistingValuesData {
  existingTradeSetup?: Doc<"trade_setups"> | null;
  existingSnapshot?: Doc<"snapshots"> | null;
  imageData?: Doc<"tradingview_images"> | null;
  smartTitle?: {
    title: string;
    usageCount: number;
  } | null;
  previousStatuses?: Doc<"snapshots">["status"][] | null;
}

// Function to create default values based on existing data
export const createAddTradeSetupDefaultValues = (
  existingValues?: ExistingValuesData
): AddTradeSetupSchema => {
  const status = existingValues?.existingSnapshot?.status || "idea";
  const result = existingValues?.existingTradeSetup?.result;

  const baseData = {
    asset: existingValues?.imageData?.asset || "",
    creationTime: existingValues?.imageData?._creationTime
      ? format(new Date(existingValues.imageData._creationTime), "HH:mm")
      : "",
    title:
      existingValues?.existingTradeSetup?.title ||
      existingValues?.smartTitle?.title ||
      "",
    direction: existingValues?.existingTradeSetup?.direction || "long",
    timeframe: existingValues?.imageData?.timeframe as Timeframe,
    timeframes: addTimeframeToTimeframes(
      existingValues?.existingTradeSetup?.timeframes as Timeframe[],
      existingValues?.imageData?.timeframe as Timeframe
    ),
    riskReward: existingValues?.existingTradeSetup?.riskReward || null,
    emotion: existingValues?.existingSnapshot?.emotion || "calm",
  } as const;

  // If status is closed and result exists, return closed schema
  if (status === "closed" && result) {
    return {
      ...baseData,
      status: "closed",
      result,
    };
  }

  // Otherwise return non-closed schema (no result field)
  return {
    ...baseData,
    status: status as
      | "idea"
      | "watching"
      | "executed"
      | "reviewed"
      | "canceled",
  };
};

// Fallback default values for when no existing data is available
export const addTradeSetupDefaultValues = <AddTradeSetupSchema>{
  asset: "",
  timeframe: "4h" as Timeframe,
  creationTime: "",
  title: "",
  direction: "long",
  timeframes: ["4h"] as Timeframe[],
  riskReward: null,
  status: "idea",
  // Note: result is intentionally omitted for non-closed statuses
};
