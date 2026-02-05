import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 19091,
    watch: {
      usePolling: true,
    },
  },
});
