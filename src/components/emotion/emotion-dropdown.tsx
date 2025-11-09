import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { emotionOptions } from "@/config/constants";
import { useGetSnapshot } from "@/hooks/snapshots/use-get-snapshot";
import { useUpdateSnapshot } from "@/hooks/snapshots/use-update-snapshot";
import { Doc, Id } from "convex/_generated/dataModel";
import { PlusIcon } from "lucide-react";

type EmotionDropdownProps = {
  value?: Doc<"snapshots">["emotion"];
  snapshotId: Id<"snapshots">;
  selected?: Doc<"snapshots">["emotion"];
  disabled?: boolean;
  placeholder?: string;
};

const EmotionDropdown = ({
  value,
  snapshotId,
  selected,
  disabled = false,
}: EmotionDropdownProps) => {
  // Fetch snapshot data if snapshotId is provided
  const { data: snapshot, isLoading } = useGetSnapshot(
    snapshotId ? { id: snapshotId } : { id: "" as Id<"snapshots"> }
  );

  const { mutateAsync } = useUpdateSnapshot();

  async function handleUpdateEmotion(emotion: Doc<"snapshots">["emotion"]) {
    await mutateAsync({ snapshotId, emotion });
  }

  // Determine the emotion to display
  const displayValue = snapshotId ? snapshot?.emotion : (value ?? selected);

  // Find the selected option configuration
  const selectedOption = emotionOptions.find(
    (opt) => opt.value === displayValue
  );

  // Show loading state if fetching snapshot
  if (snapshotId && isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border font-mono text-xs rounded-sm whitespace-nowrap border-muted text-muted-foreground animate-pulse">
        Loading...
      </div>
    );
  }

  const SelectedIcon = selectedOption?.icon || PlusIcon;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <button
              type="button"
              disabled={disabled}
              className={`flex flex-row items-center justify-between gap-2 px-3 py-2 border font-mono text-xs rounded-sm transition-all whitespace-nowrap ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              } ${
                selectedOption
                  ? selectedOption.color
                  : "border-muted text-muted-foreground hover:border-muted-foreground/50"
              }`}
            >
              <div className="flex items-center gap-2">
                {SelectedIcon && <SelectedIcon className="size-3" />}
              </div>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent className="border-none bg-transparent outline-none">
          {displayValue && (
            <button
              type="button"
              disabled={disabled}
              className={`flex flex-row items-center justify-between gap-2 px-1.5 py-1 border font-mono text-[10px] rounded-sm transition-all whitespace-nowrap ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              } ${
                selectedOption
                  ? selectedOption.color
                  : "border-muted text-muted-foreground hover:border-muted-foreground/50"
              }`}
            >
              <div className="flex items-center gap-2">
                {SelectedIcon && <SelectedIcon className="size-3" />}
                <span>{selectedOption?.label}</span>
              </div>
            </button>
          )}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="min-w-[140px]">
        {emotionOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = option.value === displayValue;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleUpdateEmotion?.(option.value)}
              className={`flex items-center gap-2 cursor-pointer ${
                isSelected ? option.color : ""
              }`}
            >
              <Icon className="size-3" />
              <span>{option.label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EmotionDropdown;
