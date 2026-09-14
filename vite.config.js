import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import gardenExportPlugin from "./scripts/garden-export-plugin";

export default defineConfig({
  plugins: [react(), gardenExportPlugin()],
  base: "/",
  build: {
    outDir: "dist",
  },
  server: {
    port: 3000,
  },
});
