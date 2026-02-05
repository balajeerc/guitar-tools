import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 19090,
    watch: {
      usePolling: true,
    },
  },
});
