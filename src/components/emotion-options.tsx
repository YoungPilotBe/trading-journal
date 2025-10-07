import { emotionOptions } from "@/config/constants";
import { Doc } from "convex/_generated/dataModel";
import EmotionOption from "./emotion-option";

type Props = {
  selected: Doc<"snapshots">["emotion"];
  disabled?: boolean;
  onClick: (emotion: Doc<"snapshots">["emotion"]) => void;
};

const EmotionOptions = ({ selected, onClick, disabled }: Props) => {
  return (
    <div className="flex flex-row gap-1.5 items-center max-w-full overflow-hidden">
      {emotionOptions.map((option) => (
        <EmotionOption
          key={option.value}
          value={option.value}
          selected={selected}
          disabled={disabled}
          onClick={onClick}
        />
      ))}
    </div>
  );
};

export default EmotionOptions;
