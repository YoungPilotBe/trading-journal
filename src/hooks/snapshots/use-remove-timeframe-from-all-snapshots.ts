import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMutation as useConvexMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface UseRemoveTimeframeFromAllSnapshotsParams {
  onSuccess?: (data: { updatedCount: number }) => void;
  onError?: (error: Error) => void;
}

export const useRemoveTimeframeFromAllSnapshots = ({
  onSuccess,
  onError,
}: UseRemoveTimeframeFromAllSnapshotsParams = {}) => {
  const queryClient = useQueryClient();
  const removeTimeframeFromAllSnapshots = useConvexMutation(
    api.snaphot.mutation.removeTimeframeFromAllSnapshots
  );

  return useMutation({
    mutationFn: async ({
      tradeSetupId,
      timeframe,
    }: {
      tradeSetupId: Id<"trade_setups">;
      timeframe: string;
    }) => {
      return await removeTimeframeFromAllSnapshots({
        tradeSetupId,
        timeframe,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });
};

