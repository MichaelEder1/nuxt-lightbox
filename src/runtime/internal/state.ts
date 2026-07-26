import { shallowReactive } from 'vue'
import type { LightboxItem, LightboxOptions } from '../types'

export interface LightboxState {
  items: LightboxItem[]
  activeIndex: number
  isOpen: boolean
  options: LightboxOptions
  triggerElement: HTMLElement | null
}

// Module-scoped singleton. Safe because it is mutated only from client-side
// interaction handlers (open/close/next/prev), never during SSR, and this
// module is only ever bundled into the client runtime via plugin.client.ts.
//
// shallowReactive, not reactive: every mutation here is a wholesale
// property reassignment (state.items = ..., state.options = ...) — nothing
// ever mutates a nested field in place (e.g. state.items[0].title = ...).
// A deep reactive() would recursively proxy every item/action object,
// which is wasted work and actively breaks passing a real Vue component as
// an action's `icon` (Vue warns about reactive-wrapping component
// definitions). shallowReactive tracks the reassignments themselves, which
// is all that's ever needed, without touching what's inside them.
const state: LightboxState = shallowReactive({
  items: [],
  activeIndex: 0,
  isOpen: false,
  options: {},
  triggerElement: null,
})

export function useLightboxState(): LightboxState {
  return state
}
