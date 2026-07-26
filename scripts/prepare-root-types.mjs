#!/usr/bin/env node
/**
 * Generates the root-level `.nuxt/tsconfig.json` (and supporting type
 * declarations) that `npm run typecheck` relies on.
 *
 * Why this exists instead of `nuxt-module-build prepare`:
 * `@nuxt/module-builder@0.8.4`'s `prepare` command calls nuxi's exported
 * `runCommand("prepare", [cwd], { overrides })` — passing the command name
 * as a *string*. nuxi's own `runCommand` (as of nuxi@3.37, resolved here via
 * the `^3.13.1` peer range) now requires the first argument to be a citty
 * command *object* with a `meta.name`, and throws
 * "Invalid command, must be named" for anything else. That's a real
 * incompatibility between the installed module-builder and nuxi versions,
 * not a local misconfiguration (see node_modules/nuxi/dist/run-P2vlcYgl.mjs
 * vs node_modules/@nuxt/module-builder/dist/chunks/prepare.mjs).
 *
 * This script replicates what that command does — and what nuxi's own
 * `prepare` command does internally (node_modules/nuxi/dist/prepare-*.mjs)
 * — directly via `@nuxt/kit` (already a dependency), loading the module
 * against a throwaway Nuxt instance rooted at the package root so the
 * generated `.nuxt/tsconfig.json` picks up `#app`/`#imports`/DOM types plus
 * this module's own runtime augmentations.
 */
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { loadNuxt, buildNuxt, writeTypes } from '@nuxt/kit'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const nuxt = await loadNuxt({
  cwd: rootDir,
  overrides: {
    // Mirrors nuxi's own `prepare` command (node_modules/nuxi/dist/prepare-*.mjs):
    // `_prepare: true` short-circuits Nuxt's build() before it runs a real
    // vite/nitro build, so this only writes types instead of producing a
    // full `.output`/`.nuxt/dist`.
    _prepare: true,
    compatibilityDate: '2024-04-03',
    typescript: {
      builder: 'shared',
    },
    imports: {
      autoImport: false,
    },
    modules: [
      resolve(rootDir, './src/module'),
      (_options, nuxt) => {
        nuxt.hooks.hook('app:templates', (app) => {
          for (const template of app.templates) {
            template.write = true
          }
        })
      },
    ],
  },
})

await buildNuxt(nuxt)
await writeTypes(nuxt)
await nuxt.close()

console.log('Generated root .nuxt types.')
