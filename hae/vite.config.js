import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Project pages are served from https://<user>.github.io/Pyy/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/Pyy/" : "/",
}));
