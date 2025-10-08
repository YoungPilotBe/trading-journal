/* eslint-disable @typescript-eslint/no-unused-vars */
import { Id } from "convex/_generated/dataModel";

interface Props extends React.InputHTMLAttributes<HTMLDivElement> {
  tradeSetupId: Id<"trade_setups">;
  snapshotId: Id<"snapshots">;
}

//@ts-expect-error dsfsdf

const TagViewTable = ({ snapshotId, tradeSetupId, ...treeProps }: Props) => {
  // const { data: snapshot } = useGetSnapshot({ id: snapshotId });
  // const { data: tradeSetup } = useGetTradeSetup({ id: tradeSetupId });

  // const treeState = useMemo(() => {
  //   console.log("Creating new Tree");
  //   return createTreeStateFromSnapshot(snapshot!);
  // }, [snapshot]);

  return (
    <></>
    // <TreeProvider
    //   tradeSetup={{ ...tradeSetup, ...(snapshot?.tags || {}) }}
    //   initialTreeState={treeState}
    // >
    //   <Tree {...treeProps} />
    // </TreeProvider>
  );
};

export default TagViewTable;
