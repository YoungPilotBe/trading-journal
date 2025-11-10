import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { statusOptions } from "@/config/constants";
import { useGetTradingJournalData } from "@/hooks/trade-setup/use-get-trading-journal-data";
import { Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Doc, Id } from "convex/_generated/dataModel";
import { format } from "date-fns";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import ResultBadge from "./result-badge";

import type { FunctionArgs } from "convex/server";
import { api } from "../../convex/_generated/api";
// Types
type JournalEntry = {
  id: Id<"trade_setups">;
  asset: string;
  result: Doc<"trade_setups">["result"];
  direction: "long" | "short";
  title: string;
  riskReward?: number;
  timeframes: string[];
  createdAt: number;
  updatedAt: number;
  snapshotCount: number;
  dateRange: {
    start: number;
    end: number;
  };
  latestStatus: Doc<"snapshots">["status"];
  latestSnapshotId?: Id<"snapshots">;
};

// Column helper
const columnHelper = createColumnHelper<JournalEntry>();

// Skeleton components
const TableRowSkeleton = () => (
  <TableRow>
    <TableCell>
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-6" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-24" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-6 w-12" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-32" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-20" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-16" />
    </TableCell>
    <TableCell>
      <Skeleton className="h-6 w-20" />
    </TableCell>
  </TableRow>
);

const TradingJournal = (
  props: FunctionArgs<typeof api.trade_setup.queries.getTradingJournalData>
) => {
  // State for filters and sorting
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Fetch all data (no limit for client-side pagination)
  const { data: journalData, isLoading } = useGetTradingJournalData(props);

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
      columnHelper.accessor("result", {
        header: ({ column }) => (
          <button
            className="flex flex-row items-center hover:bg-muted/50 p-1 rounded font-mono text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Result
          </button>
        ),
        cell: ({ getValue }) => (
          <ResultBadge result={getValue() as Doc<"trade_setups">["result"]} />
        ),
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.result;
          const b = rowB.original.result;

          // Define custom order: win, loss, breakeven, null
          const order = { win: 0, breakeven: 1, loss: 2, null: 3 };
          const aOrder = a ? order[a] : order.null;
          const bOrder = b ? order[b] : order.null;

          return aOrder - bOrder;
        },
      }),
      columnHelper.accessor("dateRange", {
        header: ({ column }) => (
          <button
            className="flex flex-row items-center hover:bg-muted/50 p-1 rounded font-mono text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </button>
        ),
        cell: ({ getValue }) => {
          const { start, end } = getValue();
          const startDate = format(new Date(start), "MMM dd");
          const endDate = format(new Date(end), "MMM dd");

          return (
            <div className="text-sm font-mono">
              {start === end ? (
                <span className="text-muted-foreground">{startDate}</span>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{startDate}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span>{endDate}</span>
                </div>
              )}
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const aStart = rowA.original.dateRange.start;
          const bStart = rowB.original.dateRange.start;
          return aStart - bStart;
        },
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
              {direction}
            </Badge>
          );
        },
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
      columnHelper.accessor("riskReward", {
        header: ({ column }) => (
          <button
            className="flex flex-row items-center hover:bg-muted/50 p-1 rounded font-mono text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Risk / Reward
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground font-mono">
            {getValue() || "-"}
          </span>
        ),
      }),
      columnHelper.accessor("snapshotCount", {
        header: ({ column }) => (
          <button
            className="flex flex-row items-center hover:bg-muted/50 p-1 rounded font-mono text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Snapshots
          </button>
        ),
        cell: ({ getValue }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("latestStatus", {
        header: ({ column }) => (
          <button
            className="flex flex-row items-center hover:bg-muted/50 p-1 rounded font-mono text-xs"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
          </button>
        ),
        cell: ({ getValue }) => {
          const status = getValue();
          const statusOption = statusOptions.find(
            (option) => option.value === status
          );

          return (
            <button
              type="button"
              className={`px-2 py-0.5 border font-mono text-xs rounded transition-all cursor-pointer shrink-0 ${
                statusOption?.color ||
                "border-gray-400/70 bg-gray-500/5 text-gray-300/80"
              }`}
            >
              {status}
            </button>
          );
        },
      }),
    ],
    []
  );

  // Create table instance
  // TODO Fix this
  const table = useReactTable({
    //@ts-expect-error err
    data: journalData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  });

  return (
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
            Array.from({ length: 5 }).map((_, index) => (
              <TableRowSkeleton key={index} />
            ))
          ) : table.getRowModel().rows?.length ? (
            // Data rows
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={
                  row.original.latestStatus === "canceled"
                    ? "relative opacity-40 after:bg-muted-foreground "
                    : ""
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <Link
                      to="/dashboard/setup"
                      search={{
                        tradeSetupId: row.original.id,
                        snapshotId: row.original
                          .latestSnapshotId as Id<"snapshots">,
                      }}
                      className="block w-full h-full"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </Link>
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            // Empty state
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-muted-foreground font-mono">
                    No trade setups found
                  </p>
                  <p className="text-sm text-muted-foreground font-mono">
                    Try adjusting your filters or create a new trade setup
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      {journalData && journalData.length > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground font-mono">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </p>
            <span className="text-sm text-muted-foreground font-mono">•</span>
            <p className="text-sm text-muted-foreground font-mono">
              Showing {table.getRowModel().rows.length} of {journalData.length}{" "}
              entries
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="badge"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="font-mono rounded-none"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="badge"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="font-mono rounded-none"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingJournal;
