import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { Id } from "convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

export interface GetNotesTradeSetupOptions {
  tradeSetupId: Id<"trade_setups">;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  status?:
    | "idea"
    | "watching"
    | "executed"
    | "closed"
    | "reviewed"
    | "canceled";
  hasNotes?: boolean;
  limit?: number;
}

export const useGetNotesTradeSetup = (options: GetNotesTradeSetupOptions) => {
  return useQuery(convexQuery(api.snaphot.queries.getNotesTradeSetup, options));
};

