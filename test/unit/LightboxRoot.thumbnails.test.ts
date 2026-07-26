import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LightboxRoot from '../../src/runtime/components/LightboxRoot.vue'
import { useLightbox } from '../../src/runtime/composables/useLightbox'
import { useLightboxState } from '../../src/runtime/internal/state'

function resetState() {
  const state = useLightboxState()
  state.items = []
  state.activeIndex = 0
  state.isOpen = false
  state.options = {}
  state.triggerElement = null
  document.body.style.overflow = ''
}

const items = [
  { type: 'image' as const, src: '/a.jpg', alt: 'a' },
  { type: 'image' as const, src: '/b.jpg', alt: 'b' },
]

describe('LightboxRoot thumbnail strip', () => {
  beforeEach(() => {
    resetState()
    document.body.innerHTML = ''
  })

  it('shows the thumbnail strip for multi-item galleries by default', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open } = useLightbox()
    open(items, 0)
    await Promise.resolve()
    expect(document.querySelector('.nuxt-lightbox__thumbnails')).not.toBeNull()
  })

  it('hides the thumbnail strip when thumbnails: false is passed', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open } = useLightbox()
    open(items, 0, { thumbnails: false })
    await Promise.resolve()
    expect(document.querySelector('.nuxt-lightbox__thumbnails')).toBeNull()
  })

  it('never shows the thumbnail strip for a single-item gallery, regardless of the option', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open } = useLightbox()
    open([items[0]!], 0, { thumbnails: true })
    await Promise.resolve()
    expect(document.querySelector('.nuxt-lightbox__thumbnails')).toBeNull()
  })
})
