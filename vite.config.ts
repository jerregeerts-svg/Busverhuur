import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// VITE_BASE wordt gezet door de GitHub Pages-workflow ("/Busverhuur/");
// overal elders (Netlify, lokaal, preview) blijft de site op "/".
export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
