import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LightboxStage from '../../src/runtime/components/LightboxStage.vue'
import { useLightbox } from '../../src/runtime/composables/useLightbox'
import { useLightboxState } from '../../src/runtime/internal/state'

function resetState() {
  const state = useLightboxState()
  state.items = []
  state.activeIndex = 0
  state.isOpen = false
  state.options = {}
  state.triggerElement = null
}

describe('LightboxStage background click', () => {
  beforeEach(resetState)

  it('closes when the empty space around the (letterboxed) item is clicked', async () => {
    useLightbox().open([{ type: 'image', src: '/a.jpg', alt: 'a' }], 0)
    const wrapper = mount(LightboxStage)
    await wrapper.find('.nuxt-lightbox__stage').trigger('click')
    expect(useLightbox().isOpen.value).toBe(false)
  })

  it('does not close when the item itself is clicked', async () => {
    useLightbox().open([{ type: 'image', src: '/a.jpg', alt: 'a' }], 0)
    const wrapper = mount(LightboxStage)
    await wrapper.find('.nuxt-lightbox__media').trigger('click')
    expect(useLightbox().isOpen.value).toBe(true)
  })

  it('does not close on stage-background click when closeOnBackdrop is false', async () => {
    useLightbox().open([{ type: 'image', src: '/a.jpg', alt: 'a' }], 0, { closeOnBackdrop: false })
    const wrapper = mount(LightboxStage)
    await wrapper.find('.nuxt-lightbox__stage').trigger('click')
    expect(useLightbox().isOpen.value).toBe(true)
  })
})
