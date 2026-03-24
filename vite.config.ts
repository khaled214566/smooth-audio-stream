import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // npm "browser" points to dist/ which is not published; use build bundle
      jsmediatags: path.resolve(__dirname, "node_modules/jsmediatags/build2/jsmediatags.js"),
      // esbuild follows require() inside jsmediatags even when that branch never runs in the browser
      "react-native-fs": path.resolve(__dirname, "src/stubs/react-native-fs.cjs"),
    },
  },
  optimizeDeps: {
    include: ["jsmediatags"],
  },
}));
