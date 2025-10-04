import { StatusContext, statusOptions } from "@/config/constants";
import { Doc } from "convex/_generated/dataModel";
import StatusOption from "./status-option";

type Props = {
  selected: Doc<"snapshots">["status"];
  disabled?: boolean;
  onClick: (status: Doc<"snapshots">["status"]) => void;
  originalStatus?: Doc<"snapshots">["status"];
  context: StatusContext; // Add this
};

const StatusOptions = ({
  selected,
  onClick,
  disabled,
  originalStatus,
  context,
}: Props) => {
  return (
    <div className="flex flex-row gap-1.5 items-center max-w-full overflow-hidden">
      {statusOptions.map((option) => (
        <StatusOption
          key={option.value}
          value={option.value}
          selected={selected}
          originalStatus={originalStatus}
          context={context}
          disabled={disabled}
          onClick={onClick}
        />
      ))}
    </div>
  );
};

export default StatusOptions;
