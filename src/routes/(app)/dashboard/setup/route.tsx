import { AnalyticsSection } from "@/components/analytics-section";
import TradeDetailsForm from "@/components/form/forms/trade-details-form";
import { TPSLFormData } from "@/components/form/schemas/tpsl-schema";
import { transformTpslEntriesToFormInput } from "@/components/form/utils";
import ImageSidebar from "@/components/image-sidebar";
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
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useDialog } from "@/contexts/dialog-context";
import { useGetMostRecentSnapshot } from "@/hooks/snapshots/use-get-most-recent-snapshot";
import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { useGetTpslEntriesBySnapshot } from "@/hooks/tpsl/use-get-tpsl-entries-by-snapshot";
import { useUpsertTpslEntries } from "@/hooks/tpsl/use-upsert-tpsl-entries";
import { useGetTradeSetup } from "@/hooks/trade-setup/use-get-trade-setup";
import { preloadSetupRouteData } from "@/lib/preloadRoutes";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";
import { Archive, MoreVertical, Tags, Target, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
  tradeSetupId: z.custom<Id<"trade_setups">>((val) => typeof val === "string"),
  snapshotId: z.custom<Id<"snapshots">>((val) => typeof val === "string"),
  noteId: z.optional(z.custom<Id<"notes">>((val) => typeof val === "string")),
  image: z.optional(z.enum(["preview"])),
  templateFilter: z.optional(z.enum(["all", "closed"])),
  templateView: z.optional(z.enum(["list", "chart"])),
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
  const { tradeSetupId, snapshotId, image, templateFilter } = Route.useSearch();

  const { openDialog } = useDialog();

  const { data: tradeSetup } = useGetTradeSetup({
    id: tradeSetupId as Id<"trade_setups">,
  });

  const { data: snapshot } = useGetSnapshot({
    id: snapshotId as Id<"snapshots">,
  });

  // Fetch TPSL entries for the current snapshot
  const { data: tpslEntries = [] } = useGetTpslEntriesBySnapshot({
    snapshotId: snapshotId as Id<"snapshots">,
  });

  // Check if current snapshot is the latest
  const { data: mostRecentSnapshot } = useGetMostRecentSnapshot({
    tradeSetupId: tradeSetupId as Id<"trade_setups">,
  });
  const isLatestSnapshot =
    mostRecentSnapshot?._id === snapshotId ||
    (mostRecentSnapshot === null && snapshotId !== undefined);

  // Mutation for updating TPSL entries
  const { mutateAsync: upsertTpslEntries } = useUpsertTpslEntries({
    onSuccess: () => {
      toast.success("TPSL updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update TPSL: ${error}`);
    },
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
                    <BreadcrumbLink
                      onClick={() => navigate({ to: "/dashboard" })}
                      className="hover:text-foreground transition-colors cursor-pointer"
                    >
                      Trade Setups
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
                <DropdownMenuTrigger
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className: "h-8 w-8 p-0 translate-x-4",
                  })}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
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
                  <DropdownMenuItem
                    className="justify-between"
                    onClick={() => {
                      if (!snapshot || !tradeSetup?.direction) {
                        toast.error(
                          "Missing snapshot or trade setup direction"
                        );
                        return;
                      }

                      // Transform TPSL entries to form input
                      const transformedTpsl = transformTpslEntriesToFormInput(
                        tpslEntries,
                        snapshot.entryPrice
                      );

                      openDialog("TPSL", {
                        direction: tradeSetup.direction,
                        initialValues: transformedTpsl,
                        readonly: !isLatestSnapshot,
                        onSave: async (data: TPSLFormData) => {
                          if (!isLatestSnapshot) {
                            return; // Should not happen, but safety check
                          }
                          await upsertTpslEntries({
                            snapshotId: snapshotId as Id<"snapshots">,
                            tpsl: data,
                          });
                        },
                      });
                    }}
                  >
                    <Target />
                    View TPSL
                  </DropdownMenuItem>
                  <DropdownMenuItem className="justify-between">
                    <Archive />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive justify-between"
                    onClick={() =>
                      openDialog("DELETE_SNAPSHOT", {
                        snapshotId,
                      })
                    }
                  >
                    <Trash2Icon className="text-inherit" />
                    Delete Snapshot
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
                    Delete Trade Setup
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Form */}
            <TradeDetailsForm tradeSetup={tradeSetup!} snapshot={snapshot!} />
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
        <ImageSidebar
          snapshotId={snapshotId as Id<"snapshots">}
          tradeSetupId={tradeSetupId as Id<"trade_setups">}
        />
      </div>

      <Separator
        className="my-8"
        text="Analytics"
        textPosition="left"
        textClassName="text-[10px] text-white"
      />
      <AnalyticsSection
        tradeSetupId={tradeSetupId as Id<"trade_setups">}
        templateFilter={templateFilter ?? "all"}
      />
      <Separator
        className="my-8"
        text="Similar Trades"
        textPosition="left"
        textClassName="text-[10px] text-white"
      />
      <SimilarTradesTable
        tradeSetupId={tradeSetupId as Id<"trade_setups">}
        snapshotId={snapshotId as Id<"snapshots">}
        limit={4}
        currentStatus={snapshot?.status}
      />
    </>
  );
}
