import { StatusContext, statusOptions } from "@/config/constants";
import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { Doc, Id } from "convex/_generated/dataModel";
import { Fragment } from "react";

type StatusOptionProps = {
  value?: Doc<"snapshots">["status"];
  snapshotId?: Id<"snapshots">;
  selected?: Doc<"snapshots">["status"];
  originalStatus?: Doc<"snapshots">["status"];
  context?: StatusContext;
  disabled?: boolean;
  onClick?: (status: Doc<"snapshots">["status"]) => void;
  showSeparator?: boolean;
  disableSeparators?: boolean;
};

const StatusOption = ({
  value,
  snapshotId,
  selected,
  originalStatus,
  context,
  disabled = false,
  onClick,
  showSeparator = false,
  disableSeparators = false,
}: StatusOptionProps) => {
  // Fetch snapshot data if snapshotId is provided
  const { data: snapshot, isLoading } = useGetSnapshot(
    snapshotId ? { id: snapshotId } : { id: "" as Id<"snapshots"> }
  );

  // Determine the status to display
  const displayValue = snapshotId ? snapshot?.status : value;

  // Find the option configuration from statusOptions
  const option = statusOptions.find((opt) => opt.value === displayValue);

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
  const isOriginalStatus = originalStatus === displayValue;
  const isStatusChanged = originalStatus && selected !== originalStatus;
  const isOptionDisabled = disabled || (context && option.disabled?.(context));

  // If it's the current status, don't show disabled styling even if it's disabled
  const shouldShowDisabled = isOptionDisabled && !isSelected;

  // Enhanced styling for original status when user has changed to different status
  const getButtonClassName = () => {
    if (isSelected) {
      return option.color;
    }

    if (isOriginalStatus && isStatusChanged) {
      // Light up the original status border with hatched pattern when user has changed to different status
      return "opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_1px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)]";
    }

    return "border-muted text-muted-foreground hover:border-muted-foreground/50";
  };

  const renderSeparator = (separator: boolean | string | undefined) => {
    if (typeof separator === "boolean") {
      return (
        <div className="h-6 flex items-center">
          <div className="w-px h-full bg-border" />
        </div>
      );
    }

    if (typeof separator === "string") {
      return (
        <div className="h-6 flex items-center relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[7px] text-muted-foreground uppercase tracking-wider font-medium whitespace-nowrap font-mono">
            {separator}
          </span>
          <div className="w-px h-full bg-border" />
        </div>
      );
    }

    return null;
  };

  const buttonElement = onClick ? (
    <button
      type="button"
      onClick={() => onClick(displayValue!)}
      disabled={isOptionDisabled}
      className={`px-1 py-0.5 border font-mono text-xs rounded-sm transition-all cursor-pointer whitespace-nowrap ${
        shouldShowDisabled ? "opacity-50 cursor-not-allowed" : ""
      } ${getButtonClassName()}`}
    >
      {option.label}
    </button>
  ) : (
    <div
      className={`px-1 py-0.5 border font-mono text-xs rounded-sm whitespace-nowrap ${getButtonClassName()}`}
    >
      {option.label}
    </div>
  );

  return (
    <Fragment>
      {buttonElement}
      {!disableSeparators &&
        (showSeparator || option.separator) &&
        renderSeparator(option.separator)}
    </Fragment>
  );
};

export default StatusOption;
