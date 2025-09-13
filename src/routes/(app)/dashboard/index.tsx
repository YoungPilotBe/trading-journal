import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Link to="/dashboard/trade_templates/trade_template">Trade Template</Link>
  );
}
