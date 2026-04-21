import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const target = (env.VITE_API_BASE_URL ?? "").trim();

  return {
    plugins: [react()],
    server: target
      ? {
          proxy: {
            "/api": {
              target,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ""),
            },
          },
        }
      : undefined,
  };
});
