import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileApiPlugin } from "./server/file-api-plugin";

export default defineConfig({
  plugins: [react(), fileApiPlugin()],
});
