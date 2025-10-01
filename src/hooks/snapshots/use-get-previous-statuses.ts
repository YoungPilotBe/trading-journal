import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { Doc } from "convex/_generated/dataModel";
import { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";

export const useGetPreviousStatuses = (
  args: FunctionArgs<typeof api.snaphot.queries.getPreviousStatuses>
) => {
  return useQuery(convexQuery(api.snaphot.queries.getPreviousStatuses, args));
};

export type PreviousStatuses = Doc<"snapshots">["status"][];
