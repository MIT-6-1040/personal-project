import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  plugins: [vue()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    // Send API calls to the backend, so the browser only ever talks to one origin.
    proxy: { "/api": process.env.BACKEND_URL ?? "http://127.0.0.1:3000" },
  },
});
