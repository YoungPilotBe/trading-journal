import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type UpdateTradeTemplate = ReturnType<
  typeof useConvexMutation<typeof api.trade_template.updateTemplate>
>;

// Infer input and output types
type MutationFn = Parameters<UpdateTradeTemplate>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<UpdateTradeTemplate>>;

export const useUpdateTradeTemplate = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(api.trade_template.updateTemplate);

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args, // onSuccess, onError, etc.
  });
};
