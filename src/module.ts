import { defineNuxtModule, addPlugin, addImportsDir, createResolver } from '@nuxt/kit'
import type { LightboxStrings } from './runtime/types'

export interface ModuleOptions {
  theme?: 'default' | 'none'
  loop?: boolean
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  closeOnRouteChange?: boolean
  thumbnails?: boolean
  strings?: LightboxStrings
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-lightbox',
    configKey: 'lightbox',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: {
    theme: 'default',
    loop: true,
    closeOnBackdrop: true,
    closeOnEsc: true,
    closeOnRouteChange: true,
    thumbnails: true,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Only JSON-serializable fields go through runtimeConfig — function-bearing
    // options (actions, onOpen/onClose/onNavigate) cannot survive this and are
    // per-call-only (see useLightbox()'s open() in Task 2, which merges this
    // object with each call's options, call-site values winning).
    //
    // `options` is typed with every field optional (ModuleOptions), but at
    // runtime `defineNuxtModule` has already merged it with `defaults` above
    // via defu, so these are never actually undefined here. The `??`
    // fallbacks (mirroring `defaults`) exist only to give the runtimeConfig
    // assignment below a concrete `boolean` type — Nuxt's generated
    // `PublicRuntimeConfig['lightbox']` type is inferred from the merged
    // runtime values, which are always defined booleans.
    nuxt.options.runtimeConfig.public.lightbox = {
      loop: options.loop ?? true,
      closeOnBackdrop: options.closeOnBackdrop ?? true,
      closeOnEsc: options.closeOnEsc ?? true,
      closeOnRouteChange: options.closeOnRouteChange ?? true,
      thumbnails: options.thumbnails ?? true,
      strings: options.strings,
    }

    addPlugin(resolver.resolve('./runtime/plugin.client'))
    addPlugin(resolver.resolve('./runtime/directives'))
    addImportsDir(resolver.resolve('./runtime/composables'))

    if (options.theme !== 'none') {
      nuxt.options.css.push(resolver.resolve('./runtime/styles/theme.css'))
    }
  },
})
