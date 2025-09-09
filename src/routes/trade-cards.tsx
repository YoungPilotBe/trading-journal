import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/trade-cards")({
  component: TradeCards,
});

function TradeCards() {
  return <div className="p-2">Hello from TradeCards!</div>;
}
