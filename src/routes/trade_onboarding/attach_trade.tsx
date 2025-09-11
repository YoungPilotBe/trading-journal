import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  imageId: z.string(),
});

export const Route = createFileRoute("/trade_onboarding/attach_trade")({
  component: RouteComponent,
  validateSearch: searchSchema,
});

function RouteComponent() {
  const { imageId } = Route.useSearch();
  return <div>Hello "/trade_onboarding/attach_trade"! Image ID: {imageId}</div>;
}
