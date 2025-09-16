import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { FunctionArgs } from "convex/server";

export const useGetSnapshotByTradeSetupId = (
  args: FunctionArgs<typeof api.snaphot.queries.getSnapshotByTradeSetup>
) => {
  return useQuery(
    convexQuery(api.snaphot.queries.getSnapshotByTradeSetup, args)
  );
};
