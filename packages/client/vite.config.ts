import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  base: "/",
  plugins: [tailwindcss(), svelte()],
  // The .env file lives at the project root
  envDir: "../..",
  resolve: { alias: { $lib: path.resolve("./src/lib") } },
  build: { sourcemap: true },
});
