import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";

export const useGetTradeSetupTimeframes = (
  args: FunctionArgs<typeof api.trade_setup.queries.getTradeSetupTimeframes>
) => {
  return useQuery(
    convexQuery(api.trade_setup.queries.getTradeSetupTimeframes, args)
  );
};

