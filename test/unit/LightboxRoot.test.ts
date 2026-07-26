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
}

describe('LightboxRoot', () => {
  beforeEach(() => {
    resetState()
    document.body.innerHTML = ''
  })

  it('renders nothing when closed', () => {
    mount(LightboxRoot, { attachTo: document.body })
    expect(document.querySelector('.nuxt-lightbox')).toBeNull()
  })

  it('renders the active image when open() is called', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open } = useLightbox()
    open([{ type: 'image', src: '/a.jpg', alt: 'A photo' }], 0)
    await Promise.resolve()
    const img = document.querySelector('.nuxt-lightbox__media') as HTMLImageElement
    expect(img).not.toBeNull()
    expect(img.getAttribute('src')).toBe('/a.jpg')
    expect(img.getAttribute('alt')).toBe('A photo')
  })

  it('close button calls close()', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open, isOpen } = useLightbox()
    open([{ type: 'image', src: '/a.jpg', alt: 'A' }], 0)
    await Promise.resolve()
    const closeBtn = document.querySelector('.nuxt-lightbox__close') as HTMLButtonElement
    closeBtn.click()
    await Promise.resolve()
    expect(isOpen.value).toBe(false)
  })
})
