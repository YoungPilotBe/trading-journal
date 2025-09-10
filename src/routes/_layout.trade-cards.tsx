import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/trade-cards")({
  component: TradeCards,
});

function TradeCards() {}
