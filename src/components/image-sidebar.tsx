import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { Id } from "convex/_generated/dataModel";
import { EmotionDropdown } from "./emotion";

interface Props {
  tradeSetupId: Id<"trade_setups">;
  snapshotId: Id<"snapshots">;
}

const ImageSidebar = ({ snapshotId }: Props) => {
  const { data: snapshot } = useGetSnapshot({ id: snapshotId });
  return (
    <div className="flex shrink-0 w-10 h-full">
      <EmotionDropdown
        selected={snapshot?.emotion}
        snapshotId={snapshotId}
        value={snapshot?.emotion}
      />
    </div>
  );
};

export default ImageSidebar;
