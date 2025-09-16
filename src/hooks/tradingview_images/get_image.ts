import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";

export const useGetImage = (
  args: FunctionArgs<typeof api.tradingview_images.getImage>
) => {
  return useQuery(convexQuery(api.tradingview_images.getImage, args));
};
