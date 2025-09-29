import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { useGetTradeSetup } from "@/hooks/trade-setup/use-get-trade-setup";
import { TreeProvider } from "@/tree/TreeContext";
import Tree from "@/tree/tree";
import { createTreeStateFromSnapshot } from "@/tree/tree.utils";
import { Id } from "convex/_generated/dataModel";
import { useMemo } from "react";

interface Props extends React.InputHTMLAttributes<HTMLDivElement> {
  tradeSetupId: Id<"trade_setups">;
  snapshotId: Id<"snapshots">;
}

const TagViewTable = ({ snapshotId, tradeSetupId, ...treeProps }: Props) => {
  const { data: snapshot } = useGetSnapshot({ id: snapshotId });
  const { data: tradeSetup } = useGetTradeSetup({ id: tradeSetupId });

  const treeState = useMemo(() => {
    console.log("Creating new Tree");
    return createTreeStateFromSnapshot(snapshot!);
  }, [snapshot]);

  return (
    <TreeProvider
      tradeSetup={{ ...tradeSetup, ...(snapshot?.tags || {}) }}
      initialTreeState={treeState}
    >
      <Tree viewOnly {...treeProps} />
    </TreeProvider>
  );
};

export default TagViewTable;
