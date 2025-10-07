import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useTreeActions } from "./TreeContext.new";

interface AddNodeButtonProps {
  templateNodeKey: string;
  label?: string;
  className?: string;
}

export const AddNodeButton = ({
  templateNodeKey,
  label = "Add",
  className,
}: AddNodeButtonProps) => {
  const { addDynamicNode } = useTreeActions();

  const handleClick = () => {
    addDynamicNode(templateNodeKey);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        // Base styles matching ToggleBadge
        "px-1 py-0.5 gap-1.5 rounded-sm text-xs font-thin border duration-200 flex items-center flex-shrink-0",
        // Untoggled state styles matching ToggleBadge default variant
        "bg-gradient-to-t from-muted/20 to-muted/10 border-muted/50 text-muted-foreground hover:from-muted hover:to-accent cursor-pointer",
        // Center the content like normal ToggleBadge layout
        "w-full justify-left",
        className
      )}
    >
      <Plus className="w-3 h-3 flex-shrink-0" />
      <span className="font-mono leading-none">{label}</span>
    </button>
  );
};
