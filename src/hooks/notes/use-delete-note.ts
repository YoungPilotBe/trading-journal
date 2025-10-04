import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type DeleteNoteFn = ReturnType<
  typeof useConvexMutation<typeof api.notes.mutation.deleteNote>
>;

// Infer input and output types
type MutationFn = Parameters<DeleteNoteFn>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<DeleteNoteFn>>;

export const useDeleteNote = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(api.notes.mutation.deleteNote);

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args, // onSuccess, onError, etc.
  });
};
