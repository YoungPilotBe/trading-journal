import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { PlusIcon } from "lucide-react";
import { Button } from "../ui/button";

const DashboardPortal = () => {
  return (
    <div
      className={clsx(
        "flex flex-row gap-3 text-muted-foreground items-center starting:opacity-0 transition-opacity"
      )}
    >
      <Link to="/dashboard/trade_templates/trade_template" className="m-0 p-0">
        <Button className="font-mono text-[10px]" variant="badge" size="badge">
          <PlusIcon className="size-3" />
          Add Template
        </Button>
      </Link>
    </div>
  );
};

export default DashboardPortal;
