import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";

export const useGetSnapshotByImageId = (
  args: FunctionArgs<typeof api.snaphot.queries.getSnapshotByImageId>
) => {
  return useQuery(convexQuery(api.snaphot.queries.getSnapshotByImageId, args));
};
