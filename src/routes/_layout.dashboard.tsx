import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div>
        <Link to="/trade_template">Create Trade Template</Link>
      </div>
    </div>
  );
}
