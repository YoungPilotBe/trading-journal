import TradeDetailsForm from "@/components/form/forms/trade-details-form";
import ResultBadge from "@/components/result-badge";
import SimilarTradesTable from "@/components/similar-trades-table";
import SnapshotHistory from "@/components/snapshot-history";
import { SnapshotImage } from "@/components/snapshot-image";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDialog } from "@/contexts/dialog-context";
import { useGetPreviousStatuses } from "@/hooks/snapshots/use-get-previous-statuses";
import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { useGetTradeSetup } from "@/hooks/trade-setup/use-get-trade-setup";
import { preloadSetupRouteData } from "@/lib/preloadRoutes";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { Archive, MoreVertical, Tags, Trash2Icon } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  tradeSetupId: z.custom<Id<"trade_setups">>((val) => typeof val === "string"),
  snapshotId: z.custom<Id<"snapshots">>((val) => typeof val === "string"),
  noteId: z.optional(z.custom<Id<"notes">>((val) => typeof val === "string")),
  image: z.optional(z.enum(["preview"])),
});

export const Route = createFileRoute("/(app)/dashboard/setup")({
  validateSearch: searchSchema,
  component: RouteComponent,
  preload: true,
  loaderDeps: ({ search: { tradeSetupId, snapshotId } }) => ({
    tradeSetupId,
    snapshotId,
  }),
  loader: async ({
    deps: { tradeSetupId, snapshotId },
    context: { queryClient },
  }) => {
    await preloadSetupRouteData(queryClient, tradeSetupId, snapshotId);
    return { tradeSetupId, snapshotId };
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const { tradeSetupId, snapshotId, image } = Route.useSearch();

  const { openDialog } = useDialog();

  const { data: tradeSetup } = useGetTradeSetup({
    id: tradeSetupId as Id<"trade_setups">,
  });

  const { data: snapshot } = useGetSnapshot({
    id: snapshotId as Id<"snapshots">,
  });

  // Get previous statuses for chronological validation
  const { data: previousStatuses = [] } = useGetPreviousStatuses({
    tradeSetupId: tradeSetupId as Id<"trade_setups">,
  });

  return (
    <>
      <div className="flex gap-8 p-6">
        {/* Left side - General Information (Fixed width) */}
        <div className="flex-shrink-0 w-fit min-w-170 @container">
          <div className="relative space-y-4">
            {/* Breadcrumbs */}
            <div className="mb-4 flex items-center justify-between mr-[40px]">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <button
                        onClick={() => navigate({ to: "/dashboard" })}
                        className="hover:text-foreground transition-colors"
                      >
                        Trade Setups
                      </button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="flex items-center gap-2">
                      {tradeSetup?.title || "Trade Setup"}
                      <ResultBadge result={tradeSetup?.result} />
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 translate-x-4"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="justify-between"
                    onClick={() => {
                      if (!snapshot) return;
                      navigate({
                        to: "/trade_onboarding/add_tags",
                        search: {
                          tradeSetupId,
                          imageId: snapshot.imageId as Id<"tradingview_images">,
                          snapshotId,
                        },
                      });
                    }}
                  >
                    <Tags />
                    View Tags
                  </DropdownMenuItem>
                  <DropdownMenuItem className="justify-between">
                    <Archive />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive justify-between"
                    onClick={() =>
                      openDialog("DELETE_TRADE_SETUP", {
                        tradeSetupId: tradeSetupId as Id<"trade_setups">,
                        tradeSetupTitle: tradeSetup?.title || "",
                      })
                    }
                  >
                    <Trash2Icon className="text-inherit" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Form */}
            <TradeDetailsForm
              tradeSetupId={tradeSetupId as Id<"trade_setups">}
              snapshotId={snapshotId as Id<"snapshots">}
              tradeSetup={tradeSetup}
              snapshot={snapshot}
              previousStatuses={previousStatuses}
            />
          </div>
        </div>

        {/* Right side - Image (Flexible width) */}
        <div className="flex-1 min-w-0 h-full">
          <SnapshotImage
            snapshotId={snapshotId}
            tradeSetupId={tradeSetupId}
            initialFullscreen={image === "preview" || false}
            className="h-full"
          />
          <SnapshotHistory
            snapshotId={snapshotId as Id<"snapshots">}
            tradeSetupId={tradeSetupId as Id<"trade_setups">}
          />
        </div>
      </div>
      <SimilarTradesTable
        tradeSetupId={tradeSetupId as Id<"trade_setups">}
        snapshotId={snapshotId as Id<"snapshots">}
        limit={4}
        currentStatus={snapshot?.status}
      />
    </>
  );
}
