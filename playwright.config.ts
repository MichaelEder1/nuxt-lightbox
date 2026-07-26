import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  webServer: {
    // Run against the Nuxt DEV server (not a production build). Vue's
    // hydration-mismatch warnings are gated behind `__DEV__` and are
    // stripped entirely from production bundles — a real mismatch in a
    // production build silently client-patches with zero console output,
    // which would make hydration.spec.ts's assertions pass regardless of
    // whether hydration actually succeeded. The dev server keeps `__DEV__`
    // true so real hydration warnings are emitted and this test can
    // actually catch them.
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
})
