import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDialog } from "@/contexts/dialog-context";
import { useGetNotesTradeSetup } from "@/hooks/notes/use-get-notes-trade-setup";
import { Doc, Id } from "convex/_generated/dataModel";
import { FileTextIcon, PlusIcon } from "lucide-react";
import {
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  useFormState,
} from "react-hook-form";

type Props<T extends FieldValues> = {
  field: ControllerRenderProps<T, FieldPath<T>>;
  label: string;
  disabled?: boolean;
  snapshotId: Id<"snapshots">;
  tradeSetupId: Id<"trade_setups">;
  snapshot?: Doc<"snapshots"> | null;
};

const NotesSelector = <T extends FieldValues>({
  field,
  label,
  disabled,
  snapshotId,
  tradeSetupId,
  snapshot,
}: Props<T>) => {
  const { openDialog } = useDialog();

  const { errors } = useFormState({ name: field.name });
  const error = errors[field.name]?.message;
  const hasError = !!error;

  const { data: notes } = useGetNotesTradeSetup({ snapshotId });

  const handleOpenNotesDialog = () => {
    openDialog("NOTES", {
      snapshotId,
      tradeSetupId,
      snapshot,
    });
  };

  return (
    <div className="grid grid-cols-[30%_1fr_2.25rem] items-center font-mono">
      <label className="text-xs text-muted" htmlFor={field.name}>
        {label}
      </label>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="badge"
          className="text-[10px] justify-between hover:bg-accent hover:text-accent-foreground transition-colors gap-1"
          disabled={disabled}
          onClick={handleOpenNotesDialog}
        >
          {notes ? (
            <>
              <FileTextIcon className="size-3" />
              {notes.length} Note{notes.length !== 1 ? "s" : ""}
            </>
          ) : (
            <>
              <PlusIcon className="size-2" />
              Add Notes
            </>
          )}
        </Button>
      </div>
      <div className="flex items-center justify-center">
        {hasError ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse starting:size-0 transition-all" />
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">{String(error)}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <div className="w-2 h-2" /> // Placeholder to maintain consistent spacing
        )}
      </div>
    </div>
  );
};

export default NotesSelector;
