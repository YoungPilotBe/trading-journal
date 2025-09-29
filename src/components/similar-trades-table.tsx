import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAnalyticsConfig } from "@/config/analytics";
import { useDialog } from "@/contexts/dialog-context";
import {
  useFindSimilarSnapshotsWithOptions,
  useFindSimilarTradeSetupsWithOptions,
} from "@/hooks/analytics/use-find-similar-trades";
import { useGetSnapshotByStatus } from "@/hooks/analytics/use-get-snapshot-by-status";
import { ConfigPreset, getConfigPreset } from "@/utils/analytics-config";
import { Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Id } from "convex/_generated/dataModel";
import { BarChart3, Target, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { DualSelector, dualSelectorVariants } from "./dual-selector";

// Types
type SimilarTradeEntry = {
  tradeSetupId: Id<"trade_setups">;
  similarityScore: number;
  snapshotId?: Id<"snapshots">; // ID of the comparison snapshot (when in snapshot mode)
  breakdown: {
    tagsPerStatusSimilarity: number;
    templateSimilarity: number;
    assetSimilarity: number;
    overallScore: number;
  };
  // Trade setup data included in the response
  asset: string;
  direction: "long" | "short";
  title: string | null;
  riskReward?: number;
  // Additional fields for snapshot mode
  snapshotStatus?: string;
  snapshotCreatedAt?: number;
};

// Smart navigation component that finds the right snapshot
const SmartTradeLink = ({
  tradeSetupId,
  currentStatus,
  snapshotId,
  children,
}: {
  tradeSetupId: Id<"trade_setups">;
  currentStatus?: string;
  snapshotId?: Id<"snapshots">;
  children: React.ReactNode;
}) => {
  // Get the snapshot with matching status (or most recent if no match) - only if snapshotId not provided
  const { data: targetSnapshot } = useGetSnapshotByStatus(
    tradeSetupId,
    currentStatus || "idea",
    { enabled: !!tradeSetupId && !!currentStatus && !snapshotId }
  );

  // Use provided snapshotId or fall back to the found snapshot
  const targetSnapshotId = snapshotId || targetSnapshot?._id || "";

  return (
    <Link
      to="/dashboard/setup"
      search={{
        tradeSetupId,
        snapshotId: targetSnapshotId,
      }}
      className="contents"
    >
      {children}
    </Link>
  );
};

// Column helper
const columnHelper = createColumnHelper<SimilarTradeEntry>();

// Skeleton components
const TableRowSkeleton = () => (
  <TableRow>
    <TableCell>
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-32" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-12" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-20" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-16" />
    </TableCell>
  </TableRow>
);

interface SimilarTradesTableProps {
  tradeSetupId: Id<"trade_setups">;
  snapshotId: Id<"snapshots">;
  limit?: number;
  currentStatus?: string;
}

const SimilarTradesTable = ({
  tradeSetupId,
  limit,
  currentStatus,
  snapshotId,
}: SimilarTradesTableProps) => {
  const { openDialog } = useDialog();

  // State for configuration preset selection
  const [selectedPreset, setSelectedPreset] = useState<ConfigPreset>("default");
  const [selectedTarget, setSelectedTarget] = useState("trade_setups");
  // Get configuration with defaults (will be overridden by preset selection)
  const config = getAnalyticsConfig();
  // State for sorting
  const [sorting, setSorting] = useState<SortingState>([
    { id: "similarityScore", desc: true },
  ]);

  // Get the selected preset configuration
  const presetConfig = getConfigPreset(selectedPreset);

  // Fetch similar trades data using the selected configuration
  // Use different hooks based on the selected target
  const { data: similarTradeSetups, isLoading: isLoadingTradeSetups } =
    useFindSimilarTradeSetupsWithOptions(tradeSetupId, {
      limit: limit ?? config.defaultLimit,
      minSimilarityScore: config.defaultMinSimilarityScore,
      customWeights: presetConfig.similarityWeights,
      enabled: selectedTarget === "trade_setups",
    });

  const { data: similarSnapshots, isLoading: isLoadingSnapshots } =
    useFindSimilarSnapshotsWithOptions(snapshotId, {
      limit: limit ?? config.defaultLimit,
      minSimilarityScore: config.defaultMinSimilarityScore,
      customWeights: presetConfig.similarityWeights,
      filterByStatus: currentStatus,
      enabled: selectedTarget === "snapshots" && !!snapshotId,
    });

  // Combine the results based on the selected target
  const similarTrades =
    selectedTarget === "trade_setups" ? similarTradeSetups : similarSnapshots;
  const isLoading =
    selectedTarget === "trade_setups"
      ? isLoadingTradeSetups
      : isLoadingSnapshots;

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor("asset", {
        header: ({ column }) => (
          <button
            className="flex flex-row items-center hover:bg-muted/50 p-1 rounded font-mono text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Pair
          </button>
        ),
        cell: ({ getValue }) => (
          <div className="font-medium text-foreground font-mono">
            {getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("title", {
        header: ({ column }) => (
          <button
            className="flex flex-row items-center hover:bg-muted/50 p-1 rounded font-mono text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-primary group-hover:underline transition-all font-mono">
            {getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("direction", {
        header: ({ column }) => (
          <button
            className="flex flex-row items-center hover:bg-muted/50 p-1 rounded font-mono text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Direction
          </button>
        ),
        cell: ({ getValue }) => {
          const direction = getValue();

          return (
            <Badge
              variant={direction === "long" ? "default" : "destructive"}
              className="capitalize text-xs px-2 py-0.5 font-medium shrink-0"
            >
              {direction === "long" ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {direction}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("riskReward", {
        header: ({ column }) => (
          <button
            className="flex flex-row items-center hover:bg-muted/50 p-1 rounded font-mono text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <Target className="mr-2 h-4 w-4" />
            Risk / Reward
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground font-mono">
            {getValue() || "Not set"}
          </span>
        ),
      }),
      columnHelper.accessor("similarityScore", {
        header: ({ column }) => (
          <button
            className="flex flex-row items-center hover:bg-muted/50 p-1 rounded font-mono text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Overall
          </button>
        ),
        cell: ({ getValue }) => {
          const score = getValue();
          return (
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${score * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {Math.round(score * 100)}%
              </span>
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          return rowA.original.similarityScore - rowB.original.similarityScore;
        },
      }),
      columnHelper.accessor("breakdown.tagsPerStatusSimilarity", {
        header: () => (
          <div className="flex items-center font-mono text-xs">Tags</div>
        ),
        cell: ({ getValue, row }) => {
          const similarityPercentage = getValue();
          const targetSnapshotId = row.original.snapshotId;

          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();

                if (!snapshotId || !targetSnapshotId) return;

                openDialog("TAGS_COMPARISON", {
                  currentSnapshotId: snapshotId,
                  targetSnapshotId,
                  similarityPercentage,
                });
              }}
              disabled={!targetSnapshotId || !snapshotId}
              className="text-xs font-mono text-muted-foreground hover:text-primary hover:underline transition-colors disabled:cursor-not-allowed disabled:hover:no-underline disabled:hover:text-muted-foreground"
            >
              {Math.round(similarityPercentage * 100)}%
            </button>
          );
        },
      }),
      columnHelper.accessor("breakdown.templateSimilarity", {
        header: () => (
          <div className="flex items-center font-mono text-xs">Strategy</div>
        ),
        cell: ({ getValue }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {Math.round(getValue() * 100)}%
          </span>
        ),
      }),
      columnHelper.accessor("breakdown.assetSimilarity", {
        header: () => (
          <div className="flex items-center font-mono text-xs">Asset</div>
        ),
        cell: ({ getValue }) => (
          <span className="text-xs font-mono text-muted-foreground">
            {Math.round(getValue() * 100)}%
          </span>
        ),
      }),
    ],
    [snapshotId, openDialog]
  );

  // Create table instance
  const table = useReactTable({
    data: (similarTrades || []).map((entry) => ({
      ...entry,
      // Convert null riskReward to undefined to match JournalEntry type
      riskReward: entry.riskReward === null ? undefined : entry.riskReward,
    })),
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (!tradeSetupId) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground font-mono">
          Select a trade setup to see similar trades
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DualSelector
            className={dualSelectorVariants({ size: "lg" })}
            leftLabel="Trade Setups"
            leftValue="trade_setups"
            rightLabel="Snapshots"
            rightValue="snapshots"
            value={selectedTarget}
            onValueChange={setSelectedTarget}
          />
          <Select
            value={selectedPreset}
            onValueChange={(value) => setSelectedPreset(value as ConfigPreset)}
          >
            <SelectTrigger className="w-44" variant="badge" size="small">
              <SelectValue placeholder="Analysis Mode">
                {(() => {
                  const presetTitles: Record<ConfigPreset, string> = {
                    default: "Default",
                    "execution-focused": "Execution Focused",
                    "strategy-focused": "Strategy Focused",
                    balanced: "Balanced",
                    custom: "Custom",
                  };
                  return presetTitles[selectedPreset] || "Analysis Mode";
                })()}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">
                <div className="flex flex-col">
                  <span className="font-medium">Default</span>
                  <span className="text-xs text-muted-foreground">
                    Balanced approach • Tags: 50% • Strategy: 30% • Asset: 20%
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="execution-focused">
                <div className="flex flex-col">
                  <span className="font-medium">Execution Focused</span>
                  <span className="text-xs text-muted-foreground">
                    How trades were executed • Tags: 70% • Strategy: 30% •
                    Asset: 0%
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="strategy-focused">
                <div className="flex flex-col">
                  <span className="font-medium">Strategy Focused</span>
                  <span className="text-xs text-muted-foreground">
                    Strategy similarity • Tags: 30% • Strategy: 50% • Asset: 20%
                  </span>
                </div>
              </SelectItem>
              <SelectItem value="balanced">
                <div className="flex flex-col">
                  <span className="font-medium">Balanced</span>
                  <span className="text-xs text-muted-foreground">
                    Equal weights • Tags: 33% • Strategy: 33% • Asset: 34%
                  </span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <TableRowSkeleton key={index} />
              ))
            ) : similarTrades && similarTrades.length > 0 ? (
              // Data rows
              table.getRowModel().rows.map((row) => (
                <SmartTradeLink
                  key={row.id}
                  tradeSetupId={row.original.tradeSetupId}
                  currentStatus={currentStatus}
                  snapshotId={row.original.snapshotId}
                >
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </SmartTradeLink>
              ))
            ) : (
              // Empty state
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="text-muted-foreground font-mono">
                      No similar trades found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SimilarTradesTable;
