import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";

export const useGetTradeTemplates = (
  args: FunctionArgs<typeof api.template.queries.getTemplates>
) => {
  return useQuery(convexQuery(api.template.queries.getTemplates, args));
};
