import TradingJournal from "@/components/trading-journal";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Define the search params schema
const setupsSearchSchema = z.object({
  asset: z.string().optional(),
  direction: z.enum(["long", "short"]).optional(),
  status: z
    .array(
      z.enum(["idea", "watching", "executed", "closed", "reviewed", "canceled"])
    )
    .optional(),
  limit: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional().default(25),
  sortBy: z.enum(["createdAt", "updatedAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const Route = createFileRoute("/(app)/dashboard/setups")({
  validateSearch: setupsSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const searchParams = Route.useSearch();

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">All Trade Setups</h1>
        <p className="text-sm text-muted-foreground">
          View and filter all your trade setups
        </p>
      </div>

      <TradingJournal {...searchParams} />
    </div>
  );
}
