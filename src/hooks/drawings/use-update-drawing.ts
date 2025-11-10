import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type UpdateDrawing = ReturnType<
  typeof useConvexMutation<typeof api.drawings.updateDrawing>
>;

// Infer input and output types
type MutationFn = Parameters<UpdateDrawing>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<UpdateDrawing>>;

export const useUpdateDrawing = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(api.drawings.updateDrawing);

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args,
  });
};
