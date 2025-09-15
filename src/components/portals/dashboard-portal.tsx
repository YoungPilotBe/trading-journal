import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { Button } from "../ui/button";

const DashboardPortal = () => {
  return (
    <div
      className={clsx(
        "flex flex-row gap-3 text-muted-foreground items-center starting:opacity-0 transition-opacity"
      )}
    >
      <Link to="/dashboard/trade_templates" className="m-0 p-0">
        <Button className="font-mono text-[10px]" variant="badge" size="badge">
          Templates
        </Button>
      </Link>
    </div>
  );
};

export default DashboardPortal;
