import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type UpdateNoteFn = ReturnType<
  typeof useConvexMutation<typeof api.notes.mutation.updateNote>
>;

// Infer input and output types
type MutationFn = Parameters<UpdateNoteFn>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<UpdateNoteFn>>;

export const useUpdateNote = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(api.notes.mutation.updateNote);

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args, // onSuccess, onError, etc.
  });
};
