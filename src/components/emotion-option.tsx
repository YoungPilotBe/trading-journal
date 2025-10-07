import { emotionOptions } from "@/config/constants";
import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { Doc, Id } from "convex/_generated/dataModel";
import { Fragment } from "react";

type EmotionOptionProps = {
  value?: Doc<"snapshots">["emotion"];
  snapshotId?: Id<"snapshots">;
  selected?: Doc<"snapshots">["emotion"];
  originalEmotion?: Doc<"snapshots">["emotion"];
  disabled?: boolean;
  onClick?: (emotion: Doc<"snapshots">["emotion"]) => void;
};

const EmotionOption = ({
  value,
  snapshotId,
  selected,
  originalEmotion,
  disabled = false,
  onClick,
}: EmotionOptionProps) => {
  // Fetch snapshot data if snapshotId is provided
  const { data: snapshot, isLoading } = useGetSnapshot(
    snapshotId ? { id: snapshotId } : { id: "" as Id<"snapshots"> }
  );

  // Determine the emotion to display
  const displayValue = snapshotId ? snapshot?.emotion : value;

  // Find the option configuration from statusOptions
  const option = emotionOptions.find((opt) => opt.value === displayValue);

  if (!option) {
    return null;
  }

  // Show loading state if fetching snapshot
  if (snapshotId && isLoading) {
    return (
      <div className="px-1 py-0.5 border font-mono text-xs rounded-sm whitespace-nowrap border-muted text-muted-foreground animate-pulse">
        Loading...
      </div>
    );
  }

  // When snapshotId is provided, always show as selected
  const isSelected = snapshotId ? true : selected === displayValue;
  const isOriginalEmotion = originalEmotion === displayValue;
  const isEmotionChanged = originalEmotion && selected !== originalEmotion;
  const isOptionDisabled = disabled;

  // If it's the current emotion, don't show disabled styling even if it's disabled
  const shouldShowDisabled = isOptionDisabled && !isSelected;

  // Enhanced styling for original emotion when user has changed to different emotion
  const getButtonClassName = () => {
    if (isSelected) {
      return option.color;
    }

    if (isOriginalEmotion && isEmotionChanged) {
      // Light up the original emotion border with hatched pattern when user has changed to different emotion
      return "opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_1px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]";
    }

    return "border-muted text-muted-foreground hover:border-muted-foreground/50";
  };

  const Icon = option.icon;

  const buttonElement = onClick ? (
    <button
      type="button"
      onClick={() => onClick(displayValue!)}
      disabled={isOptionDisabled}
      className={`flex flex-row items-center gap-1 px-1 py-0.5 border font-mono text-xs rounded-sm transition-all cursor-pointer whitespace-nowrap ${
        shouldShowDisabled ? "opacity-50 cursor-not-allowed" : ""
      } ${getButtonClassName()}`}
    >
      <Icon className="size-3" />
      {option.label}
    </button>
  ) : (
    <div
      className={`flex flex-row items-center gap-1 px-1 py-0.5 border font-mono text-xs rounded-sm whitespace-nowrap ${getButtonClassName()}`}
    >
      <Icon className="size-3" />
      {option.label}
    </div>
  );

  return <Fragment>{buttonElement}</Fragment>;
};

export default EmotionOption;
