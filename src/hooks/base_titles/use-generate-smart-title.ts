import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";

export const useGenerateSmartTitle = (
  args: FunctionArgs<typeof api.base_titles.utilities.generateSmartTitle>
) => {
  return useQuery(
    convexQuery(api.base_titles.utilities.generateSmartTitle, args)
  );
};
