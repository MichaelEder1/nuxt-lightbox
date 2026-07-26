import type { Directive, DirectiveBinding } from 'vue'
import type { LightboxItem } from '../types'
import { useLightbox } from '../composables/useLightbox'
import {
  registerTrigger,
  unregisterTrigger,
  updateTrigger,
  getGroupItems,
  getIndexInGroup,
  type TriggerGroupKey,
} from '../internal/trigger-registry'

export type LightboxDirectiveValue =
  | string
  | { group?: string, item?: Partial<LightboxItem> }
  | undefined

function resolveBinding(binding: DirectiveBinding<LightboxDirectiveValue>): {
  group?: string
  override?: Partial<LightboxItem>
} {
  const value = binding.value
  if (typeof value === 'string') return { group: value }
  if (value && typeof value === 'object') return { group: value.group, override: value.item }
  return {}
}

// Reads the same fields a hand-written LightboxItem would set for this
// element, so v-lightbox on an <img>/<video> behaves identically to
// passing the equivalent object to open() by hand.
function deriveItem(el: HTMLElement): Partial<LightboxItem> {
  const title = el.getAttribute('title') ?? undefined
  const description = el.dataset.lightboxDescription ?? undefined

  if (el instanceof HTMLImageElement) {
    return {
      type: 'image',
      src: el.currentSrc || el.src,
      alt: el.alt || undefined,
      title,
      description,
    }
  }
  if (el instanceof HTMLVideoElement) {
    return {
      type: 'video',
      src: el.currentSrc || el.src,
      // getAttribute, not el.poster: unlike src/currentSrc, poster has no
      // responsive-source resolution to account for, so the raw attribute
      // is just as correct here (it resolves fine in the real rendered
      // output regardless) — and it sidesteps environments that don't
      // fully implement the .poster property's URL-resolving getter.
      poster: el.getAttribute('poster') ?? undefined,
      autoplay: el.autoplay,
      muted: el.muted,
      loop: el.loop,
      title,
      description,
    }
  }
  return { title, description }
}

function buildItem(el: HTMLElement, binding: DirectiveBinding<LightboxDirectiveValue>): LightboxItem | null {
  const { override } = resolveBinding(binding)
  const merged = { ...deriveItem(el), ...override } as LightboxItem
  if (!merged.type || !merged.src) {
    if (import.meta.dev) {
      console.warn(
        '[nuxt-lightbox] v-lightbox could not determine a type/src for this element. '
        + 'Use it on an <img> or <video>, or provide v-lightbox="{ item: { type, src } }" explicitly.',
        el,
      )
    }
    return null
  }
  return merged
}

// Elements bound without an explicit group get their own private key, so
// unrelated standalone v-lightbox elements never accidentally batch into
// a shared gallery with each other.
const standaloneKeys = new WeakMap<HTMLElement, symbol>()

function keyFor(el: HTMLElement, group: string | undefined): TriggerGroupKey {
  if (group) return group
  let key = standaloneKeys.get(el)
  if (!key) {
    key = Symbol('nuxt-lightbox-standalone')
    standaloneKeys.set(el, key)
  }
  return key
}

const instances = new WeakMap<HTMLElement, { key: TriggerGroupKey, onClick: () => void }>()

export const vLightbox: Directive<HTMLElement, LightboxDirectiveValue> = {
  mounted(el, binding) {
    const item = buildItem(el, binding)
    if (!item) return

    const { group } = resolveBinding(binding)
    const key = keyFor(el, group)
    registerTrigger(key, el, item)

    const { open } = useLightbox()
    const onClick = () => {
      open(getGroupItems(key), getIndexInGroup(key, el))
    }
    el.addEventListener('click', onClick)
    instances.set(el, { key, onClick })
  },

  updated(el, binding) {
    const instance = instances.get(el)
    if (!instance) return
    const item = buildItem(el, binding)
    if (item) updateTrigger(instance.key, el, item)
  },

  unmounted(el) {
    const instance = instances.get(el)
    if (!instance) return
    unregisterTrigger(instance.key, el)
    el.removeEventListener('click', instance.onClick)
    instances.delete(el)
  },
}
