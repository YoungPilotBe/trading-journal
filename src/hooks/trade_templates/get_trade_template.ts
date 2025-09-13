import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";

export const useGetTradeTemplate = (
  args: FunctionArgs<typeof api.trade_template.getTemplate>
) => {
  return useQuery({
    ...convexQuery(api.trade_template.getTemplate, args),
    enabled: false,
  });
};
