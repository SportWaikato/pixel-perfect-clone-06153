// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
//
// PWA note: this app deliberately does NOT use vite-plugin-pwa. The service worker is
// hand-rolled at public/sw.js and the manifest at public/manifest.webmanifest (see AGENTS.md
// "Secure-PWA maintenance"). A previous vite-plugin-pwa setup was removed because its worker
// was never registered (no virtual:pwa-register import anywhere), its generated sw.js collided
// with public/sw.js in the build output, and its workbox config cached Supabase API responses
// (auth-sensitive data — must never be cached).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
