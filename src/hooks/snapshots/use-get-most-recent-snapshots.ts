import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";

export const useGetMostRecentSnapshots = (
  args: FunctionArgs<typeof api.snaphot.queries.getMostRecentSnapshots>
) => {
  return useQuery(
    convexQuery(api.snaphot.queries.getMostRecentSnapshots, args)
  );
};
