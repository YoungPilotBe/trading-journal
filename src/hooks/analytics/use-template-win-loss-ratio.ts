import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useTemplateWinLossRatio = (templateId: Id<"trade_templates"> | undefined) => {
  return useQuery({
    ...convexQuery(api.analytics.queries.getTemplateAnalytics, {
      templateId: templateId!,
    }),
    enabled: !!templateId,
    select: (data) => {
      if (!data) return null;
      return {
        winCount: data.winCount,
        lossCount: data.lossCount,
        avgRMultipleAll: data.avgRMultipleAll,
        avgRMultipleClosed: data.avgRMultipleClosed,
      };
    },
  });
};

