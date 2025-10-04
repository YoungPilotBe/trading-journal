import clsx from "clsx";
import { LoaderCircle } from "lucide-react";

type Props = {
  isSaving: boolean;
  className?: string;
};

const AutoSavePortal = ({ isSaving, className }: Props) => {
  return (
    <div
      className={clsx(
        "hidden flex-row gap-3 text-muted-foreground items-center starting:opacity-0 transition-opacity",
        isSaving && "!flex",
        className
      )}
    >
      <LoaderCircle className="size-3 animate-spin" />
      <span className="text-xs font-mono ">Auto saving</span>
    </div>
  );
};

export default AutoSavePortal;
