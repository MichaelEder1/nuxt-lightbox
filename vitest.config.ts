import { configDefaults, defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    exclude: [...configDefaults.exclude, 'test/e2e/**', '.worktrees/**'],
  },
  resolve: {
    alias: {
      '#app': fileURLToPath(new URL('./test/stubs/nuxt-app.ts', import.meta.url)),
    },
  },
})
