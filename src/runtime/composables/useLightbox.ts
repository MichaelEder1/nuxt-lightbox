import { computed } from 'vue'
import { useRuntimeConfig } from '#app'
import { useLightboxState } from '../internal/state'
import type { LightboxItem, LightboxOptions } from '../types'

export function useLightbox() {
  const state = useLightboxState()

  function open(items: LightboxItem[], startIndex = 0, options: LightboxOptions = {}) {
    if (items.length === 0) return
    const clampedIndex = Math.min(Math.max(startIndex, 0), items.length - 1)
    // Module-level nuxt.config.ts defaults (JSON-serializable only — see
    // module.ts) merged under per-call options, which always win.
    const moduleDefaults = (useRuntimeConfig().public.lightbox ?? {}) as LightboxOptions
    state.items = items
    state.activeIndex = clampedIndex
    state.options = { ...moduleDefaults, ...options }
    state.triggerElement = typeof document !== 'undefined'
      ? (document.activeElement as HTMLElement | null)
      : null
    state.isOpen = true
    state.options.onOpen?.(items[clampedIndex]!, clampedIndex)
  }

  function close() {
    if (!state.isOpen) return
    state.isOpen = false
    state.options.onClose?.()
    state.triggerElement?.focus?.()
  }

  function navigateTo(index: number) {
    const { items, options } = state
    if (items.length === 0) return
    const nextIndex = options.loop
      ? ((index % items.length) + items.length) % items.length
      : Math.min(Math.max(index, 0), items.length - 1)
    if (nextIndex === state.activeIndex) return
    state.activeIndex = nextIndex
    options.onNavigate?.(items[nextIndex]!, nextIndex)
  }

  function next() {
    navigateTo(state.activeIndex + 1)
  }

  function prev() {
    navigateTo(state.activeIndex - 1)
  }

  function goTo(index: number) {
    navigateTo(index)
  }

  const isOpen = computed(() => state.isOpen)
  const activeIndex = computed(() => state.activeIndex)
  const activeItem = computed(() => state.items[state.activeIndex])

  return { open, close, next, prev, goTo, isOpen, activeIndex, activeItem }
}
