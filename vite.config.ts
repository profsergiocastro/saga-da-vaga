import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const githubPagesBase = process.env["GITHUB_ACTIONS"] === "true" ? "/saga-da-vaga/" : "/";

export default defineConfig({
  vite: {
    base: githubPagesBase,
  },
  tanstackStart: {
    server: { entry: "server" },
    spa: {
      enabled: true,
      prerender: {
        outputPath: "/index.html",
      },
    },
  },
  // The game is client-side only, so no hosted server/runtime is needed.
  nitro: false,
});
