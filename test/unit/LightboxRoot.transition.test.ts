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

describe('LightboxRoot transition and hooks', () => {
  beforeEach(() => {
    resetState()
    document.body.innerHTML = ''
  })

  it('the whole overlay is wrapped in a transition with the default name when none is specified', async () => {
    // @vue/test-utils stubs <Transition> by default; disable that so the
    // real enter/leave transition classes are applied to the DOM.
    mount(LightboxRoot, { attachTo: document.body, global: { stubs: { transition: false } } })
    useLightbox().open([{ type: 'image', src: '/a.jpg' }], 0)
    await Promise.resolve()
    const overlay = document.querySelector('.nuxt-lightbox')!
    expect(overlay.className).toMatch(/nuxt-lightbox-fade/)
  })

  it('uses a custom transitionName when provided in open() options', async () => {
    mount(LightboxRoot, { attachTo: document.body, global: { stubs: { transition: false } } })
    useLightbox().open([{ type: 'image', src: '/a.jpg' }], 0, { transitionName: 'my-custom-fade' })
    await Promise.resolve()
    const overlay = document.querySelector('.nuxt-lightbox')!
    expect(overlay.className).toMatch(/my-custom-fade/)
    expect(overlay.className).not.toMatch(/nuxt-lightbox-fade/)
  })

  it('onOpen, onNavigate, and onClose all fire in the correct order through the full component tree', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const events: string[] = []
    const { open, next, close } = useLightbox()
    open(
      [{ type: 'image', src: '/a.jpg' }, { type: 'image', src: '/b.jpg' }],
      0,
      {
        onOpen: () => events.push('open'),
        onNavigate: () => events.push('navigate'),
        onClose: () => events.push('close'),
      },
    )
    await Promise.resolve()
    next()
    await Promise.resolve()
    close()
    await Promise.resolve()
    expect(events).toEqual(['open', 'navigate', 'close'])
  })
})
