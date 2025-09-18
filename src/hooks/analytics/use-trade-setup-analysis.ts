import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export const useTradeSetupAnalysis = (
  args: FunctionArgs<typeof api.analytics.queries.getTradeSetupAnalysis>
) => {
  return useQuery(
    convexQuery(api.analytics.queries.getTradeSetupAnalysis, args)
  );
};

export const useTradeSetupAnalysisWithOptions = (
  tradeSetupId: Id<"trade_setups">,
  options: {
    enabled?: boolean;
  } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    ...convexQuery(api.analytics.queries.getTradeSetupAnalysis, {
      tradeSetupId,
    }),
    enabled: enabled && !!tradeSetupId,
  });
};
