import { Separator } from "@/components/ui/separator";
import { StatusContext, statusOptions } from "@/config/constants";
import { Doc } from "convex/_generated/dataModel";
import { Fragment } from "react";

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
  const separatorRenderers = {
    boolean: () => (
      <div className="h-6 flex items-center">
        <Separator orientation="vertical" />
      </div>
    ),
    string: (label: string) => (
      <div className="h-6 flex items-center relative">
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[7px] text-muted-foreground uppercase tracking-wider font-medium whitespace-nowrap font-mono">
          {label}
        </span>
        <Separator orientation="vertical" />
      </div>
    ),
  };

  const renderSeparator = (separator: boolean | string | undefined) => {
    const type = typeof separator as keyof typeof separatorRenderers;
    return separatorRenderers[type]?.(separator as string);
  };

  return (
    <div className="flex flex-row gap-1.5 items-center">
      {statusOptions.map((option) => {
        const isSelected = selected === option.value;
        const isOriginalStatus = originalStatus === option.value;
        const isStatusChanged = originalStatus && selected !== originalStatus;
        const isDisabled = disabled || option.disabled?.(context);

        // If it's the current status, don't show disabled styling even if it's disabled
        const shouldShowDisabled = isDisabled && !isSelected;

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

        return (
          <Fragment key={option.value}>
            <button
              type="button"
              onClick={() => onClick(option.value)}
              disabled={isDisabled} // Use computed disabled state
              className={`px-1 py-0.5 border font-mono text-xs rounded-sm transition-all cursor-pointer ${shouldShowDisabled ? "opacity-50 cursor-not-allowed" : ""} ${getButtonClassName()}`}
            >
              {option.label}
            </button>
            {option.separator && renderSeparator(option.separator)}
          </Fragment>
        );
      })}
    </div>
  );
};

export default StatusOptions;
