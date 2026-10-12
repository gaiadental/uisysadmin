import { defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./vite.config.ts"

// Tests reuse the Vite configuration (plugins and the "@" alias), so imports
// resolve the same way as in the app (ARCH-FE-001 D19). Two projects split the
// suite by file extension (OQ-P-01): `.test.ts` runs in node, because the API
// layer needs no DOM; `.test.tsx` runs in jsdom, for component tests. Vitest 5
// has no environmentMatchGlobs, so the split is made with projects. Each
// project extends the root options (setup file, alias, plugins). A test file
// may still set its own environment with a comment.
const SETUP_FILES = ["./src/test/setup.ts"]

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "node",
      setupFiles: SETUP_FILES,
      projects: [
        {
          extends: true,
          test: {
            name: "node",
            environment: "node",
            include: ["src/**/*.test.ts"],
          },
        },
        {
          extends: true,
          test: {
            name: "dom",
            environment: "jsdom",
            include: ["src/**/*.test.tsx"],
          },
        },
      ],
    },
  })
)
