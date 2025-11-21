import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";

export const useGetTpslEntriesByTradeSetup = (
  args: FunctionArgs<typeof api.tpsl.queries.getTpslEntriesByTradeSetup>
) => {
  return useQuery(
    convexQuery(api.tpsl.queries.getTpslEntriesByTradeSetup, args)
  );
};
