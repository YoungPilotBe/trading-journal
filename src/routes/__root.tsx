// src/routes/__root.tsx
/// <reference types="vite/client" />
// other imports...
import globals from "@/globals.css?url";
import { createRootRoute, Outlet } from "@tanstack/react-router";
const RootLayout = () => (
  <>
    <Outlet />
  </>
);

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: "stylesheet", href: globals }],
  }),
  component: RootLayout,
});
