import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createBrowserHistory,
  createHashHistory,
  createRouter as createTanStackRouter,
} from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { ConvexProvider } from "convex/react";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  // Get the Convex URL from environment variables
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

  if (!CONVEX_URL) {
    throw new Error(
      "Missing VITE_CONVEX_URL environment variable. Please ensure it's set in your .env file."
    );
  }

  console.log("Initializing Convex with URL:", CONVEX_URL);

  let convexQueryClient: ConvexQueryClient;
  try {
    convexQueryClient = new ConvexQueryClient(CONVEX_URL);
  } catch (error) {
    console.error("Failed to initialize ConvexQueryClient:", error);
    throw new Error(
      "Failed to initialize Convex client. Please check your VITE_CONVEX_URL."
    );
  }

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  });

  convexQueryClient.connect(queryClient);

  // Create appropriate history based on environment
  const history = (() => {
    // Check if we're running in Electron
    const isElectron =
      typeof window !== "undefined" &&
      window.process &&
      window.process.type === "renderer";

    if (isElectron) {
      // Use hash history in Electron for better compatibility
      return createHashHistory();
    } else {
      // Use browser history in regular browser environment
      return createBrowserHistory();
    }
  })();

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      history,
      defaultPreload: "intent",
      context: { queryClient },
      Wrap: ({ children }) => (
        <ConvexProvider client={convexQueryClient.convexClient}>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
          {children}
        </ConvexProvider>
      ),
    }),
    queryClient
  );

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
