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
  const baseData = {
    asset: existingValues?.imageData?.asset || "",
    creationTime: existingValues?.imageData?._creationTime
      ? format(new Date(existingValues.imageData._creationTime), "HH:mm")
      : "",
    title: existingValues?.smartTitle?.title || "",
    direction: existingValues?.existingTradeSetup?.direction || "long",
    timeframe: existingValues?.imageData?.timeframe as Timeframe,
    timeframes: addTimeframeToTimeframes(
      existingValues?.existingTradeSetup?.timeframes as Timeframe[],
      existingValues?.imageData?.timeframe as Timeframe
    ),
    riskReward: existingValues?.existingTradeSetup?.riskReward || null,
  };

  // If there's an existing trade setup with a result, return closed status
  if (
    existingValues?.existingTradeSetup?.result &&
    existingValues.existingSnapshot?.status
  ) {
    return {
      ...baseData,
      status: existingValues.existingSnapshot?.status,
      result: existingValues.existingTradeSetup.result,
    };
  }

  // Return non-closed status
  return {
    ...baseData,
    status:
      (existingValues?.existingSnapshot?.status as
        | "idea"
        | "watching"
        | "executed"
        | "reviewed"
        | "canceled") || "idea",
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
