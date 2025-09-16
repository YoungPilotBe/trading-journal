import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
export type UpdateSnapshot = ReturnType<
  typeof useConvexMutation<typeof api.snaphot.mutation.updateSnapshot>
>;

// Infer input and output types
type MutationFn = Parameters<UpdateSnapshot>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<UpdateSnapshot>>;

export const useUpdateSnapshot = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(api.snaphot.mutation.updateSnapshot);

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args, // onSuccess, onError, etc.
  });
};
