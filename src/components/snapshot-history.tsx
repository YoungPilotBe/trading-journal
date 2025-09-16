import { useGetSnapshotByTradeSetupId } from "@/hooks/snapshots/use-get-snapshot-by-trade-setup";
import { Id } from "convex/_generated/dataModel";

interface Props {
  tradeSetupId: Id<"trade_setups">;
  snapshotId: Id<"snapshots">;
}

const SnapshotHistory = ({ snapshotId, tradeSetupId }: Props) => {
  const { data: snapshots, isLoading: isLoadingSnapshots } =
    useGetSnapshotByTradeSetupId({
      tradeSetupId: tradeSetupId as Id<"trade_setups">,
    });
  return <div>SnapshotHistory</div>;
};

export default SnapshotHistory;
