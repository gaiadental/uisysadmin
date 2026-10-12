import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type Plugin } from "vite"

const API_BASE_URL_VAR = "VITE_API_BASE_URL"

// Build-time guard (REQ-FE-003, REQ-FE-047, ADR-006): a set, non-empty API base
// URL must be HTTPS. The value is read from the env files for the mode and from
// process.env, and is never logged. The error names the variable only.
function apiBaseUrlGuard(): Plugin {
  return {
    name: "api-base-url-guard",
    apply: "build",
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir, "VITE_")
      const value = env[API_BASE_URL_VAR]
      if (
        value !== undefined &&
        value !== "" &&
        !value.startsWith("https://")
      ) {
        throw new Error(
          `${API_BASE_URL_VAR} must be empty or start with "https://". ` +
            "Set an https:// value or leave it empty, then run the build again."
        )
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiBaseUrlGuard()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      // "^" makes this a regex match on "/api/" with the trailing slash, so
      // only /api/ paths are proxied and SPA routes such as /apiary are not.
      "^/api/": {
        target: "http://127.0.0.1:8080",
        changeOrigin: false,
        configure: (proxy) => {
          // The gateway picks the SYSTEM context from the Host header (D1.1).
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Host", "system.gaia.localhost")
          })
        },
      },
    },
  },
})
