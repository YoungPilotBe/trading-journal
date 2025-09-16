import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type DeleteTradeSetup = ReturnType<
  typeof useConvexMutation<typeof api.trade_setup.mutations.deleteTradeSetup>
>;

// Infer input and output types
type MutationFn = Parameters<DeleteTradeSetup>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<DeleteTradeSetup>>;

export const useDeleteTradeSetup = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(
    api.trade_setup.mutations.deleteTradeSetup
  );

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args, // onSuccess, onError, etc.
  });
};
