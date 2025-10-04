import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { FunctionArgs } from "convex/server";
import { api } from "../../../convex/_generated/api";

export const useGetNote = (
  args: FunctionArgs<typeof api.notes.queries.getNote>
) => {
  return useQuery(convexQuery(api.notes.queries.getNote, args));
};
