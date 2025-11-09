import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type DeleteSnapshot = ReturnType<
  typeof useConvexMutation<typeof api.snaphot.mutation.deleteSnapshot>
>;

// Infer input and output types
type MutationFn = Parameters<DeleteSnapshot>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<DeleteSnapshot>>;

export const useDeleteSnapshot = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(api.snaphot.mutation.deleteSnapshot);

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args, // onSuccess, onError, etc.
  });
};
