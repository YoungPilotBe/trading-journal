import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

// Type of the mutation function from Convex
type UpsertTpslEntries = ReturnType<
  typeof useConvexMutation<typeof api.tpsl.mutations.upsertTpslEntries>
>;

// Infer input and output types
type MutationFn = Parameters<UpsertTpslEntries>[0]; // args to the mutation
type MutationData = Awaited<ReturnType<UpsertTpslEntries>>;

export const useUpsertTpslEntries = (
  args?: UseMutationOptions<MutationData, unknown, MutationFn>
) => {
  const mutationFn = useConvexMutation(api.tpsl.mutations.upsertTpslEntries);

  return useMutation<MutationData, unknown, MutationFn>({
    mutationFn,
    ...args, // onSuccess, onError, etc.
  });
};

