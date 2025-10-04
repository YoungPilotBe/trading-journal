import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";

export const useGetNotesSnapshot = (
  args: FunctionArgs<typeof api.notes.queries.getNotesSnapshot>
) => {
  return useQuery(convexQuery(api.notes.queries.getNotesSnapshot, args));
};
