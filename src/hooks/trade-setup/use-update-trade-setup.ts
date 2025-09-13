import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type UpdateTradeSetupFn = ReturnType<
  typeof useConvexMutation<typeof api.trade_setup.updateTradeSetup>
>;

// Infer input and output types
type MutationFn = Parameters<UpdateTradeSetupFn>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<UpdateTradeSetupFn>>;

export const useUpdateTradeSetup = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(api.trade_setup.updateTradeSetup);

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args,
  });
};
