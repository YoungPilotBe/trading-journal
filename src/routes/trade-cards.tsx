import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../convex/_external_types/tradingview_image_alert_types";
export const Route = createFileRoute("/trade-cards")({
  component: TradeCards,
});

function TradeCards() {
  const files = useQuery(
    convexQuery(api.fileStorage.listFiles, { source: "tradingview" })
  );
  return <div className="p-2">{JSON.stringify(files)}</div>;
}
