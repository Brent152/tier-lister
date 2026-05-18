import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileApiPlugin } from "./server/file-api-plugin";

export default defineConfig({
  plugins: [react(), fileApiPlugin()],
  server: {
    // Tier-list data is written here by the file-api plugin on every autosave.
    // Without this, each save triggers Vite's dev watcher -> full page reload.
    watch: {
      ignored: ["**/tier-lists/**"],
    },
  },
});
