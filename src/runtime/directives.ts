import { defineNuxtPlugin } from '#app'
import { vLightbox } from './directives/lightbox'

// Universal (not .client.ts): registering a directive is just adding it to
// the app's directive registry, which is safe and cheap during SSR too.
// The directive's own mounted/updated/unmounted hooks never fire during
// SSR regardless — but if the directive isn't *resolvable* server-side,
// Vue's SSR renderer warns "Failed to resolve directive" for any
// server-rendered template using v-lightbox. Registering it universally
// avoids that warning without changing when the directive's logic runs.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('lightbox', vLightbox)
})
