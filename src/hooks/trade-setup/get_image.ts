import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";

export const useGetTradeImage = (
  args: FunctionArgs<typeof api.tradingview_images.queries.getImage>
) => {
  return useQuery(convexQuery(api.tradingview_images.queries.getImage, args));
};
