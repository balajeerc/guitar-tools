import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 19090,
    allowedHosts: [".trycloudflare.com"],
    watch: {
      usePolling: true,
    },
  },
});
