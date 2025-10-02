import { useGenerateSmartTitle } from "@/hooks/base_titles/use-generate-smart-title";
import { useGetPreviousStatuses } from "@/hooks/snapshots/use-get-previous-statuses";
import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { useGetTradeSetup } from "@/hooks/trade-setup/use-get-trade-setup";
import { useGetImage } from "@/hooks/tradingview_images/get_image";
import { Id } from "convex/_generated/dataModel";

interface Props {
  imageId: Id<"tradingview_images">;
  snapshotId: Id<"snapshots">;
  tradeSetupId: Id<"trade_setups">;
}

export const useExistingValues = ({
  snapshotId,
  imageId,
  tradeSetupId,
}: Props) => {
  const { data: existingTradeSetup, isLoading: isLoadingTradeSetup } =
    useGetTradeSetup({
      id: tradeSetupId,
    });

  const { data: imageData, isLoading: isLoadingImage } = useGetImage({
    id: imageId,
  });

  const { data: smartTitle, isPending: isPendingGeneratingSmartTitle } =
    useGenerateSmartTitle({});

  const { data: existingSnapshot, isLoading: isLoadingSnapshot } =
    useGetSnapshot({ id: snapshotId });

  // Get previous statuses for chronological validation
  const { data: previousStatuses = [] } = useGetPreviousStatuses({
    tradeSetupId,
  });

  const isLoading =
    isLoadingTradeSetup ||
    isLoadingSnapshot ||
    isLoadingTradeSetup ||
    isPendingGeneratingSmartTitle ||
    isLoadingImage;

  return {
    existingTradeSetup,
    existingSnapshot,
    previousStatuses,
    smartTitle,
    isLoading,
    imageData,
  };
};
