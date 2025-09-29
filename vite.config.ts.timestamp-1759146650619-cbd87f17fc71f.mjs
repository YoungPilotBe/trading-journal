// vite.config.ts
import tailwindcss from "file:///Users/thomasrobijn/Developer/trading-journal/node_modules/@tailwindcss/vite/dist/index.mjs";
import { tanstackRouter } from "file:///Users/thomasrobijn/Developer/trading-journal/node_modules/@tanstack/router-plugin/dist/esm/vite.js";
import react from "file:///Users/thomasrobijn/Developer/trading-journal/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "node:path";
import { defineConfig, loadEnv } from "file:///Users/thomasrobijn/Developer/trading-journal/node_modules/vite/dist/node/index.js";
import electron from "file:///Users/thomasrobijn/Developer/trading-journal/node_modules/vite-plugin-electron/dist/simple.mjs";
var __vite_injected_original_dirname = "/Users/thomasrobijn/Developer/trading-journal";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (!env.VITE_CONVEX_URL) {
    console.warn(`Warning: VITE_CONVEX_URL not found in .env.${mode} file`);
  }
  return {
    plugins: [
      tailwindcss(),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true
      }),
      react(),
      electron({
        main: {
          // Shortcut of `build.lib.entry`.
          entry: "electron/main.ts"
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          input: path.join(__vite_injected_original_dirname, "electron/preload.ts")
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: process.env.NODE_ENV === "test" ? (
          // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
          void 0
        ) : {}
      })
    ],
    // Resolve to resolve the build process import aliases
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    // Define environment variables for the build
    define: {
      __DEV__: mode === "development",
      __PROD__: mode === "production"
    },
    // Build configuration
    build: {
      // Don't minify for better error traces in production if needed
      minify: mode === "production",
      sourcemap: mode === "development"
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvdGhvbWFzcm9iaWpuL0RldmVsb3Blci90cmFkaW5nLWpvdXJuYWxcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy90aG9tYXNyb2Jpam4vRGV2ZWxvcGVyL3RyYWRpbmctam91cm5hbC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvdGhvbWFzcm9iaWpuL0RldmVsb3Blci90cmFkaW5nLWpvdXJuYWwvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XG5pbXBvcnQgeyB0YW5zdGFja1JvdXRlciB9IGZyb20gXCJAdGFuc3RhY2svcm91dGVyLXBsdWdpbi92aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IGVsZWN0cm9uIGZyb20gXCJ2aXRlLXBsdWdpbi1lbGVjdHJvbi9zaW1wbGVcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgLy8gTG9hZCBlbnYgZmlsZSBiYXNlZCBvbiBgbW9kZWAgaW4gdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgXCJcIik7XG5cbiAgLy8gVmFsaWRhdGUgcmVxdWlyZWQgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gIGlmICghZW52LlZJVEVfQ09OVkVYX1VSTCkge1xuICAgIGNvbnNvbGUud2FybihgV2FybmluZzogVklURV9DT05WRVhfVVJMIG5vdCBmb3VuZCBpbiAuZW52LiR7bW9kZX0gZmlsZWApO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICB0YWlsd2luZGNzcygpLFxuICAgICAgdGFuc3RhY2tSb3V0ZXIoe1xuICAgICAgICB0YXJnZXQ6IFwicmVhY3RcIixcbiAgICAgICAgYXV0b0NvZGVTcGxpdHRpbmc6IHRydWUsXG4gICAgICB9KSxcbiAgICAgIHJlYWN0KCksXG4gICAgICBlbGVjdHJvbih7XG4gICAgICAgIG1haW46IHtcbiAgICAgICAgICAvLyBTaG9ydGN1dCBvZiBgYnVpbGQubGliLmVudHJ5YC5cbiAgICAgICAgICBlbnRyeTogXCJlbGVjdHJvbi9tYWluLnRzXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHByZWxvYWQ6IHtcbiAgICAgICAgICAvLyBTaG9ydGN1dCBvZiBgYnVpbGQucm9sbHVwT3B0aW9ucy5pbnB1dGAuXG4gICAgICAgICAgLy8gUHJlbG9hZCBzY3JpcHRzIG1heSBjb250YWluIFdlYiBhc3NldHMsIHNvIHVzZSB0aGUgYGJ1aWxkLnJvbGx1cE9wdGlvbnMuaW5wdXRgIGluc3RlYWQgYGJ1aWxkLmxpYi5lbnRyeWAuXG4gICAgICAgICAgaW5wdXQ6IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiZWxlY3Ryb24vcHJlbG9hZC50c1wiKSxcbiAgICAgICAgfSxcbiAgICAgICAgLy8gUGxveWZpbGwgdGhlIEVsZWN0cm9uIGFuZCBOb2RlLmpzIEFQSSBmb3IgUmVuZGVyZXIgcHJvY2Vzcy5cbiAgICAgICAgLy8gSWYgeW91IHdhbnQgdXNlIE5vZGUuanMgaW4gUmVuZGVyZXIgcHJvY2VzcywgdGhlIGBub2RlSW50ZWdyYXRpb25gIG5lZWRzIHRvIGJlIGVuYWJsZWQgaW4gdGhlIE1haW4gcHJvY2Vzcy5cbiAgICAgICAgLy8gU2VlIFx1RDgzRFx1REM0OSBodHRwczovL2dpdGh1Yi5jb20vZWxlY3Ryb24tdml0ZS92aXRlLXBsdWdpbi1lbGVjdHJvbi1yZW5kZXJlclxuICAgICAgICByZW5kZXJlcjpcbiAgICAgICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJ0ZXN0XCJcbiAgICAgICAgICAgID8gLy8gaHR0cHM6Ly9naXRodWIuY29tL2VsZWN0cm9uLXZpdGUvdml0ZS1wbHVnaW4tZWxlY3Ryb24tcmVuZGVyZXIvaXNzdWVzLzc4I2lzc3VlY29tbWVudC0yMDUzNjAwODA4XG4gICAgICAgICAgICAgIHVuZGVmaW5lZFxuICAgICAgICAgICAgOiB7fSxcbiAgICAgIH0pLFxuICAgIF0sXG5cbiAgICAvLyBSZXNvbHZlIHRvIHJlc29sdmUgdGhlIGJ1aWxkIHByb2Nlc3MgaW1wb3J0IGFsaWFzZXNcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgIH0sXG4gICAgfSxcblxuICAgIC8vIERlZmluZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIHRoZSBidWlsZFxuICAgIGRlZmluZToge1xuICAgICAgX19ERVZfXzogbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiLFxuICAgICAgX19QUk9EX186IG1vZGUgPT09IFwicHJvZHVjdGlvblwiLFxuICAgIH0sXG5cbiAgICAvLyBCdWlsZCBjb25maWd1cmF0aW9uXG4gICAgYnVpbGQ6IHtcbiAgICAgIC8vIERvbid0IG1pbmlmeSBmb3IgYmV0dGVyIGVycm9yIHRyYWNlcyBpbiBwcm9kdWN0aW9uIGlmIG5lZWRlZFxuICAgICAgbWluaWZ5OiBtb2RlID09PSBcInByb2R1Y3Rpb25cIixcbiAgICAgIHNvdXJjZW1hcDogbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiLFxuICAgIH0sXG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeVQsT0FBTyxpQkFBaUI7QUFDalYsU0FBUyxzQkFBc0I7QUFDL0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLGNBQWMsZUFBZTtBQUN0QyxPQUFPLGNBQWM7QUFMckIsSUFBTSxtQ0FBbUM7QUFRekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFFeEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksR0FBRyxFQUFFO0FBRzNDLE1BQUksQ0FBQyxJQUFJLGlCQUFpQjtBQUN4QixZQUFRLEtBQUssOENBQThDLElBQUksT0FBTztBQUFBLEVBQ3hFO0FBRUEsU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLE1BQ1AsWUFBWTtBQUFBLE1BQ1osZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFFBQ1IsbUJBQW1CO0FBQUEsTUFDckIsQ0FBQztBQUFBLE1BQ0QsTUFBTTtBQUFBLE1BQ04sU0FBUztBQUFBLFFBQ1AsTUFBTTtBQUFBO0FBQUEsVUFFSixPQUFPO0FBQUEsUUFDVDtBQUFBLFFBQ0EsU0FBUztBQUFBO0FBQUE7QUFBQSxVQUdQLE9BQU8sS0FBSyxLQUFLLGtDQUFXLHFCQUFxQjtBQUFBLFFBQ25EO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFJQSxVQUNFLFFBQVEsSUFBSSxhQUFhO0FBQUE7QUFBQSxVQUVyQjtBQUFBLFlBQ0EsQ0FBQztBQUFBLE1BQ1QsQ0FBQztBQUFBLElBQ0g7QUFBQTtBQUFBLElBR0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFHQSxRQUFRO0FBQUEsTUFDTixTQUFTLFNBQVM7QUFBQSxNQUNsQixVQUFVLFNBQVM7QUFBQSxJQUNyQjtBQUFBO0FBQUEsSUFHQSxPQUFPO0FBQUE7QUFBQSxNQUVMLFFBQVEsU0FBUztBQUFBLE1BQ2pCLFdBQVcsU0FBUztBQUFBLElBQ3RCO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
