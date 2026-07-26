import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LightboxControls from '../../src/runtime/components/LightboxControls.vue'
import { useLightbox } from '../../src/runtime/composables/useLightbox'
import { useLightboxState } from '../../src/runtime/internal/state'

const items = [
  { type: 'image' as const, src: '/a.jpg', alt: 'a' },
  { type: 'image' as const, src: '/b.jpg', alt: 'b' },
  { type: 'image' as const, src: '/c.jpg', alt: 'c' },
]

function resetState() {
  const state = useLightboxState()
  state.items = []
  state.activeIndex = 0
  state.isOpen = false
  state.options = {}
  state.triggerElement = null
}

describe('LightboxControls', () => {
  beforeEach(resetState)

  it('renders the counter using the default template', () => {
    useLightbox().open(items, 1)
    const wrapper = mount(LightboxControls)
    expect(wrapper.find('.nuxt-lightbox__counter').text()).toBe('2 / 3')
  })

  it('renders the counter using a custom counterTemplate', () => {
    useLightbox().open(items, 1, { strings: { counterTemplate: '{current} of {total}' } })
    const wrapper = mount(LightboxControls)
    expect(wrapper.find('.nuxt-lightbox__counter').text()).toBe('2 of 3')
  })

  it('substitutes every occurrence of a repeated token in counterTemplate', () => {
    useLightbox().open(items, 1, { strings: { counterTemplate: '{current}/{total} ({current})' } })
    const wrapper = mount(LightboxControls)
    expect(wrapper.find('.nuxt-lightbox__counter').text()).toBe('2/3 (2)')
  })

  it('next button advances activeIndex', async () => {
    const { open, activeIndex } = useLightbox()
    open(items, 0)
    const wrapper = mount(LightboxControls)
    await wrapper.find('.nuxt-lightbox__next').trigger('click')
    expect(activeIndex.value).toBe(1)
  })

  it('prev button decrements activeIndex', async () => {
    const { open, activeIndex } = useLightbox()
    open(items, 2)
    const wrapper = mount(LightboxControls)
    await wrapper.find('.nuxt-lightbox__prev').trigger('click')
    expect(activeIndex.value).toBe(1)
  })
})
