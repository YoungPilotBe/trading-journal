import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type DeleteImage = ReturnType<
  typeof useConvexMutation<typeof api.tradingview_images.mutations.deleteImage>
>;

// Infer input and output types
type MutationFn = Parameters<DeleteImage>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<DeleteImage>>;

export const useDeleteImage = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(
    api.tradingview_images.mutations.deleteImage
  );

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args,
  });
};
