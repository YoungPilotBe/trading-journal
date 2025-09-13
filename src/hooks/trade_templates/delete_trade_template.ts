import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type DeleteTradeTemplate = ReturnType<
  typeof useConvexMutation<typeof api.trade_template.deleteTemplate>
>;

// Infer input and output types
type MutationFn = Parameters<DeleteTradeTemplate>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<DeleteTradeTemplate>>;

export const useDeleteTradeTemplate = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(api.trade_template.deleteTemplate);

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args, // onSuccess, onError, etc.
  });
};
