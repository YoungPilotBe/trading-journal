import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <main className="bg-red-500 w-8 h-5 font-bold">Hello World</main>;
}
