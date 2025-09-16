import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import environment from "vite-plugin-environment";

dotenv.config({ path: "../../.env" });

export default defineConfig({
  build: {
    emptyOutDir: true,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
    include: ["@dfinity/vetkeys", "@dfinity/agent", "@dfinity/principal", "@dfinity/candid"],
  },
  server: {
    proxy: {
      "/api/v2": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v2/, "/api/v2"),
      },
    },
  },
  publicDir: "assets",
  plugins: [
    react(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
  ],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
    ],
    dedupe: ["@dfinity/agent", "@dfinity/vetkeys", "@dfinity/principal", "@dfinity/candid"],
  },
});

