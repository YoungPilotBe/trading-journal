import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type CreateTradeTemplate = ReturnType<
  typeof useConvexMutation<typeof api.trade_template.createTemplate>
>;

// Infer input and output types
type MutationFn = Parameters<CreateTradeTemplate>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<CreateTradeTemplate>>;

export const useCreateTradeTemplate = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(api.trade_template.createTemplate);

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args, // onSuccess, onError, etc.
  });
};
