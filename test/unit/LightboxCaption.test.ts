import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LightboxCaption from '../../src/runtime/components/LightboxCaption.vue'
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

describe('LightboxCaption', () => {
  beforeEach(resetState)

  it('renders title and description as plain text', () => {
    useLightbox().open([{ type: 'image', src: '/a.jpg', title: 'A <b>Title</b>', description: 'Desc' }], 0)
    const wrapper = mount(LightboxCaption)
    expect(wrapper.find('.nuxt-lightbox__title').text()).toBe('A <b>Title</b>')
    expect(wrapper.find('.nuxt-lightbox__title').html()).not.toContain('<b>')
    expect(wrapper.find('.nuxt-lightbox__description').text()).toBe('Desc')
  })

  it('renders nothing when the item has no title or description', () => {
    useLightbox().open([{ type: 'image', src: '/a.jpg' }], 0)
    const wrapper = mount(LightboxCaption)
    expect(wrapper.find('.nuxt-lightbox__title').exists()).toBe(false)
    expect(wrapper.find('.nuxt-lightbox__description').exists()).toBe(false)
  })

  it('uses the #caption slot when provided, passing item and index', () => {
    useLightbox().open([{ type: 'image', src: '/a.jpg', title: 'T' }], 0)
    const wrapper = mount(LightboxCaption, {
      slots: {
        caption: `<template #caption="{ item, index }"><div class="custom">{{ item.title }}-{{ index }}</div></template>`,
      },
    })
    expect(wrapper.find('.custom').text()).toBe('T-0')
    expect(wrapper.find('.nuxt-lightbox__title').exists()).toBe(false)
  })
})
