import { cQuery } from "@/lib/convex-utils";
import { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import z from "zod";
import { api } from "../../convex/_generated/api";
import { searchSchema } from "../routes/trade_onboarding/add_template";
// Import the route to get its exact search type
// Middleware that uses the exact search type from the add_trade route

export async function templateMiddleware({
  search,
  context: { queryClient },
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  search: z.infer<typeof searchSchema>;
  context: { queryClient: QueryClient };
}) {
  const { tradeSetupId } = search;

  if (!tradeSetupId) throw new Error("No tradeSetup id");

  // Use the constant
  const tradeSetup = await queryClient.fetchQuery(
    cQuery(api.trade_setup.queries.getTradeSetup, { id: tradeSetupId })
  );

  if (tradeSetup?.trade_template) {
    // Ensure required fields are present and of correct type for the redirect
    if (!search.snapshotId || !search.tradeSetupId) {
      return;
    }
    throw redirect({
      to: "/trade_onboarding/add_tags",
      search: {
        ...search,
      },
    });
  }

  return { tradeSetup };
}
