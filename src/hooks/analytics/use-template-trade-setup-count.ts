import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useTemplateTradeSetupCount = (templateId: Id<"trade_templates"> | undefined) => {
  return useQuery({
    ...convexQuery(api.analytics.queries.getTemplateAnalytics, {
      templateId: templateId!,
    }),
    enabled: !!templateId,
    select: (data) => {
      if (!data) return null;
      return {
        tradeSetupCount: data.tradeSetupCount,
      };
    },
  });
};

