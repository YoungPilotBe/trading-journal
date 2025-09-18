import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export const useGetSnapshotByStatus = (
  tradeSetupId: Id<"trade_setups">,
  status: string,
  options: {
    enabled?: boolean;
  } = {}
) => {
  const { enabled = true } = options;

  return useQuery({
    ...convexQuery(api.analytics.queries.getSnapshotByStatus, {
      tradeSetupId,
      status,
    }),
    enabled: enabled && !!tradeSetupId && !!status,
  });
};
