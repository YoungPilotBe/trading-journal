import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusOptions } from "@/config/constants";
import { useGetTradeSetups } from "@/hooks/trade-setup/use-get-trade-setups";
import { useGetUniqueAssets } from "@/hooks/trade-setup/use-get-unique-assets";
import { useGetImage } from "@/hooks/tradingview_images/get_image";
import { Link } from "@tanstack/react-router";
import { Doc, Id } from "convex/_generated/dataModel";
import { X } from "lucide-react";
import { useState } from "react";
const TradeSetupHeader = () => {
  const [selectedAsset, setSelectedAsset] = useState<string>("all");
  const [selectedDirection, setSelectedDirection] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const clearAllFilters = () => {
    setSelectedAsset("all");
    setSelectedDirection("all");
    setSelectedStatus("all");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const { data: uniqueAssets } = useGetUniqueAssets();
  const { data, isLoading } = useGetTradeSetups({
    limit: 4,
    asset: selectedAsset === "all" ? undefined : selectedAsset,
    sortBy,
    sortOrder,
    direction:
      selectedDirection === "all"
        ? undefined
        : (selectedDirection as Doc<"trade_setups">["direction"]),
    status:
      selectedStatus === "all"
        ? undefined
        : (selectedStatus as Doc<"trade_setups">["status"]),
  });

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        {/* Controls skeleton */}
        <div className="flex gap-4 items-center">
          <div className="w-40 h-7 bg-muted/20 rounded animate-pulse" />
          <div className="w-32 h-7 bg-muted/20 rounded animate-pulse" />
          <div className="w-36 h-7 bg-muted/20 rounded animate-pulse" />
          <div className="w-40 h-7 bg-muted/20 rounded animate-pulse" />
          <div className="w-8 h-7 bg-muted/20 rounded animate-pulse" />
        </div>
        {/* Cards skeleton */}
        <div className="w-full grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse h-28 bg-background">
              <CardContent className="h-full bg-muted/20 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <div className="flex gap-4 items-center">
        <Select value={selectedAsset} onValueChange={setSelectedAsset}>
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

        <Select value={selectedDirection} onValueChange={setSelectedDirection}>
          <SelectTrigger className="w-32" variant="badge" size="small">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Long / Short</SelectItem>
            <SelectItem value="long">Long</SelectItem>
            <SelectItem value="short">Short</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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

        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={(value) => {
            const [newSortBy, newSortOrder] = value.split("-") as [
              typeof sortBy,
              typeof sortOrder,
            ];
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
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

        <Button
          variant="ghost"
          size="icon"
          onClick={clearAllFilters}
          className="h-7 w-7 shrink-0"
          title="Clear all filters"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Cards */}
      <div className="w-full grid grid-cols-4 gap-4">
        {data?.map((setup) => (
          <Link
            key={setup._id}
            to="/dashboard/setup"
            search={{ tradeSetupId: setup._id }}
            className="group"
          >
            <TradeSetupCard setup={setup} />
          </Link>
        ))}
      </div>
    </div>
  );
};

const TradeSetupCard = ({
  setup,
}: {
  setup: NonNullable<ReturnType<typeof useGetTradeSetups>["data"]>[0];
}) => {
  const { data: image } = useGetImage({
    id: setup.imageId as Id<"tradingview_images">,
  });
  return (
    <Card className="relative bg-background border-2 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5 group-hover:bg-accent/5 overflow-hidden">
      <CardContent className="h-full flex flex-col justify-center">
        <div className="h-24">
          <img
            src={image?.url || undefined}
            alt="Image"
            className="object-contain absolute inset-0 mask-b-from-0%"
          />
        </div>
        <div className="space-y-2 z-10">
          {/* Asset and Direction */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base leading-tight truncate">
                {setup.asset}
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                {setup.title}
              </p>
            </div>
            <Badge
              variant={setup.direction === "long" ? "default" : "destructive"}
              className="capitalize text-xs px-2 py-0.5 font-medium shrink-0"
            >
              {setup.direction}
            </Badge>
          </div>

          {/* Trade Template */}
          <div className="text-xs text-muted-foreground font-mono truncate">
            {setup.tradeTemplateData?.title}
          </div>

          {/* Status and Date */}
          <div className="flex justify-between items-center gap-2">
            <button
              key={setup.status}
              type="button"
              className={`px-2 py-0.5 border font-mono text-xs rounded transition-all cursor-pointer shrink-0 ${
                statusOptions.find((option) => option.value === setup.status)
                  ?.color || "border-gray-400/70 bg-gray-500/5 text-gray-300/80"
              }`}
            >
              {setup.status}
            </button>
            <div className="text-xs text-muted-foreground font-mono">
              {new Date(setup.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeSetupHeader;
