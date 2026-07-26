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

describe('LightboxRoot close behaviors', () => {
  beforeEach(() => {
    resetState()
    document.body.innerHTML = ''
  })

  it('locks body scroll while open and unlocks on close', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open, close } = useLightbox()
    open([{ type: 'image', src: '/a.jpg', alt: 'a' }], 0)
    await Promise.resolve()
    expect(document.body.style.overflow).toBe('hidden')
    close()
    await Promise.resolve()
    expect(document.body.style.overflow).toBe('')
  })

  it('Esc key closes when closeOnEsc is not false', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open, isOpen } = useLightbox()
    open([{ type: 'image', src: '/a.jpg', alt: 'a' }], 0, { closeOnEsc: true })
    await Promise.resolve()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await Promise.resolve()
    expect(isOpen.value).toBe(false)
  })

  it('Esc key does nothing when closeOnEsc is false', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open, isOpen } = useLightbox()
    open([{ type: 'image', src: '/a.jpg', alt: 'a' }], 0, { closeOnEsc: false })
    await Promise.resolve()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await Promise.resolve()
    expect(isOpen.value).toBe(true)
  })

  it('backdrop click closes when closeOnBackdrop is not false', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open, isOpen } = useLightbox()
    open([{ type: 'image', src: '/a.jpg', alt: 'a' }], 0, { closeOnBackdrop: true })
    await Promise.resolve()
    const backdrop = document.querySelector('.nuxt-lightbox__backdrop') as HTMLElement
    backdrop.click()
    await Promise.resolve()
    expect(isOpen.value).toBe(false)
  })

  it('clicking the dialog background (e.g. the gap around a narrow caption) closes it too', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open, isOpen } = useLightbox()
    open([{ type: 'image', src: '/a.jpg', alt: 'a', title: 'A' }], 0, { closeOnBackdrop: true })
    await Promise.resolve()
    const dialog = document.querySelector('.nuxt-lightbox__dialog') as HTMLElement
    dialog.click()
    await Promise.resolve()
    expect(isOpen.value).toBe(false)
  })

  it('clicking the caption text (bubbling up through the dialog) does not close it', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open, isOpen } = useLightbox()
    open([{ type: 'image', src: '/a.jpg', alt: 'a', title: 'A title' }], 0, { closeOnBackdrop: true })
    await Promise.resolve()
    const title = document.querySelector('.nuxt-lightbox__title') as HTMLElement
    title.click()
    await Promise.resolve()
    expect(isOpen.value).toBe(true)
  })

  it('ArrowRight/ArrowLeft do not navigate the gallery while focus is inside a text input (e.g. a custom caption slot)', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open, activeIndex } = useLightbox()
    open([{ type: 'image', src: '/a.jpg' }, { type: 'image', src: '/b.jpg' }], 0)
    await Promise.resolve()

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await Promise.resolve()
    expect(activeIndex.value).toBe(0)

    document.body.removeChild(input)
  })

  it('ArrowRight still navigates the gallery when focus is on a non-text control (e.g. a button)', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open, activeIndex } = useLightbox()
    open([{ type: 'image', src: '/a.jpg' }, { type: 'image', src: '/b.jpg' }], 0)
    await Promise.resolve()

    const closeButton = document.querySelector('.nuxt-lightbox__close') as HTMLElement
    closeButton.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    await Promise.resolve()
    expect(activeIndex.value).toBe(1)
  })
})
