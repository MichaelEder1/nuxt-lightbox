import { createApp } from 'vue'
import { defineNuxtPlugin } from '#app'
import LightboxRoot from './components/LightboxRoot.vue'
import { useLightboxState } from './internal/state'

export default defineNuxtPlugin((nuxtApp) => {
  if (typeof document === 'undefined') return

  const container = document.createElement('div')
  container.id = 'nuxt-lightbox-root'
  document.body.appendChild(container)

  const overlayApp = createApp(LightboxRoot)
  overlayApp.mount(container)

  nuxtApp.hook('page:finish', () => {
    const state = useLightboxState()
    if (state.isOpen && state.options.closeOnRouteChange !== false) {
      state.isOpen = false
    }
  })
})
