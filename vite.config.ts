import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    // agent worktrees build in-root; html output triggers full dev reload
    watch: { ignored: ["**/.claude/**"] },
  },
  build: {
    target: "esnext",
    cssMinify: "lightningcss",
    modulePreload: { polyfill: false },
  },
});
