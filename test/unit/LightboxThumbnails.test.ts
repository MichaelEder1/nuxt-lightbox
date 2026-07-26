import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LightboxThumbnails from '../../src/runtime/components/LightboxThumbnails.vue'
import { useLightbox } from '../../src/runtime/composables/useLightbox'
import { useLightboxState } from '../../src/runtime/internal/state'

const items = [
  { type: 'image' as const, src: '/a.jpg', thumbnail: '/a-thumb.jpg', alt: 'a' },
  { type: 'image' as const, src: '/b.jpg', thumbnail: '/b-thumb.jpg', alt: 'b' },
]

function resetState() {
  const state = useLightboxState()
  state.items = []
  state.activeIndex = 0
  state.isOpen = false
  state.options = {}
  state.triggerElement = null
}

describe('LightboxThumbnails', () => {
  beforeEach(resetState)

  it('renders one thumbnail per item, using thumbnail or falling back to src', () => {
    useLightbox().open(items, 0)
    const wrapper = mount(LightboxThumbnails)
    const imgs = wrapper.findAll('.nuxt-lightbox__thumbnail img')
    expect(imgs).toHaveLength(2)
    expect(imgs[0]!.attributes('src')).toBe('/a-thumb.jpg')
  })

  it('marks the active thumbnail with the --active class', () => {
    useLightbox().open(items, 1)
    const wrapper = mount(LightboxThumbnails)
    const thumbs = wrapper.findAll('.nuxt-lightbox__thumbnail')
    expect(thumbs[1]!.classes()).toContain('nuxt-lightbox__thumbnail--active')
    expect(thumbs[0]!.classes()).not.toContain('nuxt-lightbox__thumbnail--active')
  })

  it('clicking a thumbnail navigates to that index', async () => {
    const { open, activeIndex } = useLightbox()
    open(items, 0)
    const wrapper = mount(LightboxThumbnails)
    await wrapper.findAll('.nuxt-lightbox__thumbnail')[1]!.trigger('click')
    expect(activeIndex.value).toBe(1)
  })

  it('derives a youtube hqdefault thumbnail from a bare video ID when no explicit thumbnail is given', () => {
    useLightbox().open([{ type: 'youtube', src: 'dQw4w9WgXcQ' }], 0)
    const wrapper = mount(LightboxThumbnails)
    const img = wrapper.find('.nuxt-lightbox__thumbnail img')
    expect(img.attributes('src')).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  })

  it('derives a youtube hqdefault thumbnail from a full watch URL when no explicit thumbnail is given', () => {
    useLightbox().open([{ type: 'youtube', src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }], 0)
    const wrapper = mount(LightboxThumbnails)
    const img = wrapper.find('.nuxt-lightbox__thumbnail img')
    expect(img.attributes('src')).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  })

  it('falls back to the poster for a video item with no explicit thumbnail', () => {
    useLightbox().open([{ type: 'video', src: '/movie.mp4', poster: '/poster.jpg' }], 0)
    const wrapper = mount(LightboxThumbnails)
    const img = wrapper.find('.nuxt-lightbox__thumbnail img')
    expect(img.attributes('src')).toBe('/poster.jpg')
  })

  it('falls back to src as a last resort for a video item with no thumbnail or poster', () => {
    useLightbox().open([{ type: 'video', src: '/movie.mp4' }], 0)
    const wrapper = mount(LightboxThumbnails)
    const img = wrapper.find('.nuxt-lightbox__thumbnail img')
    expect(img.attributes('src')).toBe('/movie.mp4')
  })

  it('falls back to src as a last resort for a vimeo item with no explicit thumbnail', () => {
    useLightbox().open([{ type: 'vimeo', src: '76979871' }], 0)
    const wrapper = mount(LightboxThumbnails)
    const img = wrapper.find('.nuxt-lightbox__thumbnail img')
    expect(img.attributes('src')).toBe('76979871')
  })

  it('gives each thumbnail button an accessible name even when the item has no alt text', () => {
    useLightbox().open([{ type: 'image', src: '/a.jpg' }], 0)
    const wrapper = mount(LightboxThumbnails)
    const button = wrapper.find('.nuxt-lightbox__thumbnail')
    expect(button.attributes('aria-label')).toBe('Go to item 1')
  })

  it('uses the item title as the thumbnail button aria-label when present', () => {
    useLightbox().open([{ type: 'image', src: '/a.jpg', title: 'Sunset' }], 0)
    const wrapper = mount(LightboxThumbnails)
    const button = wrapper.find('.nuxt-lightbox__thumbnail')
    expect(button.attributes('aria-label')).toBe('Sunset')
  })

  it('still prefers an explicit thumbnail over any derived fallback', () => {
    useLightbox().open(
      [{ type: 'youtube', src: 'dQw4w9WgXcQ', thumbnail: '/custom-thumb.jpg' }],
      0,
    )
    const wrapper = mount(LightboxThumbnails)
    const img = wrapper.find('.nuxt-lightbox__thumbnail img')
    expect(img.attributes('src')).toBe('/custom-thumb.jpg')
  })
})
