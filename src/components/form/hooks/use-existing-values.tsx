import { useGenerateSmartTitle } from "@/hooks/base_titles/use-generate-smart-title";
import { useGetPreviousStatuses } from "@/hooks/snapshots/use-get-previous-statuses";
import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { useGetTradeSetupBySnapshotId } from "@/hooks/trade-setup/use-get-trade-setup-by-image-id";
import { useGetImage } from "@/hooks/tradingview_images/get_image";
import { Id } from "convex/_generated/dataModel";

interface Props {
  imageId: Id<"tradingview_images">;
  snapshotId: Id<"snapshots">;
}

export const useExistingValues = ({ snapshotId, imageId }: Props) => {
  const { data: existingTradeSetup, isLoading: isLoadingTradeSetup } =
    useGetTradeSetupBySnapshotId({
      snapshotId,
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
    tradeSetupId: existingTradeSetup?._id,
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
