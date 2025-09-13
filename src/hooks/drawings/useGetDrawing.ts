import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";

export const useGetDrawing = (
  args: FunctionArgs<typeof api.drawings.getDrawing>
) => {
  return useQuery({
    ...convexQuery(api.drawings.getDrawing, args),
    enabled: !!args.id,
  });
};
