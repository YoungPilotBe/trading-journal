// src/routes/__root.tsx
/// <reference types="vite/client" />
// other imports...
import globals from "@/globals.css?url";
import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
const RootLayout = () => (
  <>
    <Outlet />
  </>
);

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [{ type: "stylesheet", rel: globals }],
  }),
  component: RootLayout,
});
