// `@nuxt/eslint-config@0.5.x`'s `/flat` entry only has named exports
// (`createConfigForNuxt`, `defineFlatConfigs`, `resolveOptions`) — there is
// no default export in this version, so `import createConfig from '...'`
// resolves to `undefined` and ESLint's flat-config loader throws a
// SyntaxError before any files are linted.
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt().append(
  {
    // ESLint's flat config doesn't read .gitignore automatically; without
    // this, linting from the repo root also walks into any git worktree
    // nested under .worktrees/ (a full separate checkout with its own
    // copy of every file), double-linting and double-reporting everything.
    ignores: ['.worktrees/**'],
  },
  {
    // Nuxt's file-based routing requires `pages/index.vue` / `pages/other.vue`
    // style single-word filenames; this config isn't run from inside the
    // playground app so the Nuxt-aware auto-exception doesn't kick in.
    files: ['playground/pages/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
)
