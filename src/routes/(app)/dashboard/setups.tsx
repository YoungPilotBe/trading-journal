import TradingJournal from "@/components/trading-journal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { statusOptions } from "@/config/constants";
import { useGetUniqueAssets } from "@/hooks/trade-setup/use-get-unique-assets";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
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
  sortBy: z.enum(["createdAt", "updatedAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  pageSize: z.number().int().positive().optional().default(25),
});

export const Route = createFileRoute("/(app)/dashboard/setups")({
  validateSearch: setupsSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: uniqueAssets } = useGetUniqueAssets();

  // Helper to update search params
  const updateSearchParam = <K extends keyof typeof searchParams>(
    key: K,
    value: (typeof searchParams)[K]
  ) => {
    navigate({
      search: (prev) => ({
        ...prev,
        [key]: value === undefined || value === "all" ? undefined : value,
      }),
    });
  };

  const clearAllFilters = () => {
    navigate({
      search: {
        sortBy: "createdAt",
        sortOrder: "desc",
      },
    });
  };

  const hasActiveFilters =
    searchParams.asset ||
    searchParams.direction ||
    searchParams.status ||
    searchParams.limit;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">All Trade Setups</h1>
        <p className="text-sm text-muted-foreground">
          View and filter all your trade setups
        </p>
      </div>

      <Separator />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Asset Filter */}
        <Select
          value={searchParams.asset || "all"}
          onValueChange={(value) =>
            updateSearchParam("asset", value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-40" variant="badge" size="small">
            <SelectValue placeholder="Filter by asset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assets</SelectItem>
            {uniqueAssets?.map((asset) => (
              <SelectItem key={asset} value={asset}>
                {asset}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Direction Filter */}
        <Select
          value={searchParams.direction || "all"}
          onValueChange={(value) =>
            updateSearchParam(
              "direction",
              value === "all" ? undefined : (value as "long" | "short")
            )
          }
        >
          <SelectTrigger className="w-32" variant="badge" size="small">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Long / Short</SelectItem>
            <SelectItem value="long">Long</SelectItem>
            <SelectItem value="short">Short</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={searchParams.status ? searchParams.status.join(",") : "all"}
          onValueChange={(value) => {
            if (value === "all") {
              updateSearchParam("status", undefined);
            } else {
              updateSearchParam(
                "status",
                value.split(",") as Array<
                  | "idea"
                  | "watching"
                  | "executed"
                  | "closed"
                  | "reviewed"
                  | "canceled"
                >
              );
            }
          }}
        >
          <SelectTrigger className="w-36" variant="badge" size="small">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort By & Order */}
        <Select
          value={`${searchParams.sortBy}-${searchParams.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split("-") as [
              "createdAt" | "updatedAt",
              "asc" | "desc",
            ];
            navigate({
              search: (prev) => ({
                ...prev,
                sortBy,
                sortOrder,
              }),
            });
          }}
        >
          <SelectTrigger className="w-40" variant="badge" size="small">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
            <SelectItem value="updatedAt-asc">Least Updated</SelectItem>
          </SelectContent>
        </Select>

        {/* Limit Filter */}
        <Select
          value={searchParams.limit?.toString() || "all"}
          onValueChange={(value) =>
            updateSearchParam(
              "limit",
              value === "all" ? undefined : parseInt(value)
            )
          }
        >
          <SelectTrigger className="w-28" variant="badge" size="small">
            <SelectValue placeholder="Limit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearAllFilters}
            className="h-7 w-7 shrink-0"
            title="Clear all filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator
        leftText="Trade Setups"
        rightText={
          searchParams.limit ? `Limited to ${searchParams.limit}` : "All"
        }
        leftTextClassName="text-xs"
        rightTextClassName="text-xs"
      />

      {/* Trading Journal Table */}
      <TradingJournal {...searchParams} />
    </div>
  );
}
