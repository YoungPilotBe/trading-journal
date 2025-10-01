// src/routes/__root.tsx
/// <reference types="vite/client" />
// other imports...
import { DialogManager } from "@/components/dialog-manager";
import { Toaster } from "@/components/ui/sonner";
import { DialogProvider } from "@/contexts/dialog-context";
import globals from "@/globals.css?url";
import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import {
  TanStackRouterDevtools,
  TanStackRouterDevtoolsInProd,
} from "@tanstack/react-router-devtools";

const RootLayout = () => (
  <DialogProvider>
    <DialogManager />
    <Outlet />
    <Toaster />
    <TanStackRouterDevtools />
    <TanStackRouterDevtoolsInProd />
  </DialogProvider>
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
        title: "Trading Journal",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: globals,
      },
    ],
  }),
  component: RootLayout,
});
