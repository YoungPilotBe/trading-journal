import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type CreateSnapshotFn = ReturnType<
  typeof useConvexMutation<typeof api.snaphot.mutation.createSnapshot>
>;

// Infer input and output types
type MutationFn = Parameters<CreateSnapshotFn>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<CreateSnapshotFn>>;

export const useCreateSnapshot = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(api.snaphot.mutation.createSnapshot);

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args, // onSuccess, onError, etc.
  });
};
