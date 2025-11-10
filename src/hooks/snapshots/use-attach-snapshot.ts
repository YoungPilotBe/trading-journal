import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type AttachSnapshot = ReturnType<
  typeof useConvexMutation<typeof api.snaphot.mutation.attachSnapshot>
>;

// Infer input and output types
type MutationFn = Parameters<AttachSnapshot>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<AttachSnapshot>>;

export const useAttachSnapshot = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(api.snaphot.mutation.attachSnapshot);

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args, // onSuccess, onError, etc.
  });
};
