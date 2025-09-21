import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { useGetTradeSetup } from "@/hooks/trade-setup/use-get-trade-setup";
import { EffectsProvider } from "@/tree/EffectsContext";
import Tree from "@/tree/tree";
import { createTreeStateFromSnapshot } from "@/tree/tree.utils";
import { Id } from "convex/_generated/dataModel";

interface Props {
  tradeSetupId: Id<"trade_setups">;
  snapshotId: Id<"snapshots">;
}

const TagViewTable = ({ snapshotId, tradeSetupId }: Props) => {
  const { data: snapshot } = useGetSnapshot({ id: snapshotId });
  const { data: tradeSetup } = useGetTradeSetup({ id: tradeSetupId });
  const treeState = createTreeStateFromSnapshot(snapshot!);

  return (
    <EffectsProvider
      tradeSetup={{ ...tradeSetup, ...(snapshot?.tags || {}) }}
      selectedTags={treeState?.selectedNodes}
    >
      <Tree initialTreeState={treeState} viewOnly />
    </EffectsProvider>
  );
};

export default TagViewTable;
