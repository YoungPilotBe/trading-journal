import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type CreateNoteFn = ReturnType<
  typeof useConvexMutation<typeof api.notes.mutation.createNote>
>;

// Infer input and output types
type MutationFn = Parameters<CreateNoteFn>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<CreateNoteFn>>;

export const useCreateNote = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(api.notes.mutation.createNote);

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args, // onSuccess, onError, etc.
  });
};
