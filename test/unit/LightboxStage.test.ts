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

describe('LightboxStage', () => {
  beforeEach(resetState)

  it('renders an img for an image item', () => {
    useLightbox().open([{ type: 'image', src: '/a.jpg', alt: 'a' }], 0)
    const wrapper = mount(LightboxStage)
    expect(wrapper.find('.nuxt-lightbox__media').element.tagName).toBe('IMG')
  })

  it('renders a video element with the right attributes for a video item', () => {
    useLightbox().open(
      [{ type: 'video', src: '/movie.mp4', poster: '/poster.jpg', autoplay: true, muted: true, loop: true }],
      0,
    )
    const wrapper = mount(LightboxStage)
    const video = wrapper.find('.nuxt-lightbox__media')
    expect(video.element.tagName).toBe('VIDEO')
    expect(video.attributes('poster')).toBe('/poster.jpg')
    expect(video.attributes('autoplay')).toBeDefined()
    expect(video.attributes('muted')).toBeDefined()
    expect(video.attributes('loop')).toBeDefined()
    expect(video.attributes('controls')).toBeDefined()
  })

  it('sets the video element\'s `muted` DOM property (not just the attribute) so muted playback is reliable', () => {
    useLightbox().open([{ type: 'video', src: '/movie.mp4', muted: true }], 0)
    const wrapper = mount(LightboxStage)
    const video = wrapper.find('.nuxt-lightbox__media').element as HTMLVideoElement
    expect(video.muted).toBe(true)
  })

  it('leaves the video element unmuted when the item does not request muted playback', () => {
    useLightbox().open([{ type: 'video', src: '/movie.mp4' }], 0)
    const wrapper = mount(LightboxStage)
    const video = wrapper.find('.nuxt-lightbox__media').element as HTMLVideoElement
    expect(video.muted).toBe(false)
  })

  it('shows the error state when the image fails to load, instead of a broken icon forever', async () => {
    useLightbox().open([{ type: 'image', src: '/missing.jpg', alt: 'missing' }], 0)
    const wrapper = mount(LightboxStage)
    await wrapper.find('.nuxt-lightbox__media').trigger('error')
    expect(wrapper.find('.nuxt-lightbox__error').exists()).toBe(true)
    expect(wrapper.find('.nuxt-lightbox__media').exists()).toBe(false)
  })

  it('renders an iframe (and no img/video) for an active youtube item', () => {
    useLightbox().open([{ type: 'youtube', src: 'dQw4w9WgXcQ' }], 0)
    const wrapper = mount(LightboxStage)
    const embed = wrapper.find('.nuxt-lightbox__media--embed')
    expect(embed.exists()).toBe(true)
    expect(embed.element.tagName).toBe('IFRAME')
    expect(embed.attributes('src')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('video').exists()).toBe(false)
  })

  it('gives the embed iframe an accessible title, preferring the item title over alt over a generic fallback', async () => {
    const lightbox = useLightbox()
    lightbox.open(
      [
        { type: 'youtube', src: 'dQw4w9WgXcQ', title: 'My Video', alt: 'ignored' },
        { type: 'youtube', src: 'dQw4w9WgXcQ', alt: 'Alt text only' },
        { type: 'youtube', src: 'dQw4w9WgXcQ' },
      ],
      0,
    )
    const wrapper = mount(LightboxStage)
    expect(wrapper.find('iframe').attributes('title')).toBe('My Video')

    lightbox.goTo(1)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('iframe').attributes('title')).toBe('Alt text only')

    lightbox.goTo(2)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('iframe').attributes('title')).toBe('Video')
  })

  it('renders an iframe (and no img/video) for an active vimeo item', () => {
    useLightbox().open([{ type: 'vimeo', src: '76979871' }], 0)
    const wrapper = mount(LightboxStage)
    const embed = wrapper.find('.nuxt-lightbox__media--embed')
    expect(embed.exists()).toBe(true)
    expect(embed.element.tagName).toBe('IFRAME')
    expect(embed.attributes('src')).toBe('https://player.vimeo.com/video/76979871')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('video').exists()).toBe(false)
  })

  it('replaces the iframe with an img when navigating from a youtube item to an image item', async () => {
    const lightbox = useLightbox()
    lightbox.open(
      [
        { type: 'youtube', src: 'dQw4w9WgXcQ' },
        { type: 'image', src: '/a.jpg', alt: 'a' },
      ],
      0,
    )
    const wrapper = mount(LightboxStage)
    expect(wrapper.find('.nuxt-lightbox__media--embed').exists()).toBe(true)

    lightbox.goTo(1)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.nuxt-lightbox__media--embed').exists()).toBe(false)
    expect(wrapper.find('iframe').exists()).toBe(false)
    const img = wrapper.find('.nuxt-lightbox__media')
    expect(img.exists()).toBe(true)
    expect(img.element.tagName).toBe('IMG')
  })

  it('replaces the iframe with a video when navigating from a vimeo item to a video item', async () => {
    const lightbox = useLightbox()
    lightbox.open(
      [
        { type: 'vimeo', src: '76979871' },
        { type: 'video', src: '/movie.mp4' },
      ],
      0,
    )
    const wrapper = mount(LightboxStage)
    expect(wrapper.find('.nuxt-lightbox__media--embed').exists()).toBe(true)

    lightbox.next()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.nuxt-lightbox__media--embed').exists()).toBe(false)
    expect(wrapper.find('iframe').exists()).toBe(false)
    const video = wrapper.find('.nuxt-lightbox__media')
    expect(video.exists()).toBe(true)
    expect(video.element.tagName).toBe('VIDEO')
  })

  it('shows the error state instead of an iframe when the youtube src is unparseable', () => {
    useLightbox().open([{ type: 'youtube', src: 'not-a-valid-id' }], 0)
    const wrapper = mount(LightboxStage)
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.find('.nuxt-lightbox__error').exists()).toBe(true)
  })

  it('shows the error state instead of an iframe when the vimeo src is unparseable', () => {
    useLightbox().open([{ type: 'vimeo', src: 'not-a-valid-id' }], 0)
    const wrapper = mount(LightboxStage)
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.find('.nuxt-lightbox__error').exists()).toBe(true)
  })
})
