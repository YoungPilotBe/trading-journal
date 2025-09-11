import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

export const useCreateTradeSetup = () => {
  return useMutation({
    mutationFn: useConvexMutation(api["trade_setup"].createTradeSetup),
  });
};
