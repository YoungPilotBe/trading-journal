import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { Id } from "convex/_generated/dataModel";
import { EmotionDropdown } from "./emotion";
import NotesSelector from "./form/features/notes-selector";

interface Props {
  tradeSetupId: Id<"trade_setups">;
  snapshotId: Id<"snapshots">;
}

const ImageSidebar = ({ snapshotId, tradeSetupId }: Props) => {
  const { data: snapshot } = useGetSnapshot({ id: snapshotId });
  return (
    <div className="flex shrink-0 w-10 h-full flex flex-col gap-2">
      <EmotionDropdown
        selected={snapshot?.emotion}
        snapshotId={snapshotId}
        value={snapshot?.emotion}
      />
      <NotesSelector snapshotId={snapshotId} tradeSetupId={tradeSetupId} />
    </div>
  );
};

export default ImageSidebar;
