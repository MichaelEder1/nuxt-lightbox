import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
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

describe('LightboxRoot accessibility', () => {
  beforeEach(() => {
    resetState()
    document.body.innerHTML = ''
  })

  it('the dialog has role="dialog" and aria-modal="true"', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    useLightbox().open([{ type: 'image', src: '/a.jpg', title: 'Photo' }], 0)
    await Promise.resolve()
    const dialog = document.querySelector('.nuxt-lightbox__dialog')!
    expect(dialog.getAttribute('role')).toBe('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('focus returns to the trigger element on close', async () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Open'
    document.body.appendChild(trigger)
    trigger.focus()

    mount(LightboxRoot, { attachTo: document.body })
    const { open, close } = useLightbox()
    open([{ type: 'image', src: '/a.jpg' }], 0)
    await Promise.resolve()
    close()
    await Promise.resolve()
    expect(document.activeElement).toBe(trigger)
  })

  it('moves focus into the dialog when it opens (integration, not unit-tested trapFocus)', async () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Open'
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    mount(LightboxRoot, { attachTo: document.body })
    useLightbox().open([{ type: 'image', src: '/a.jpg', title: 'Photo' }], 0)
    await nextTick()
    await nextTick()

    const dialog = document.querySelector('.nuxt-lightbox__dialog')!
    expect(document.activeElement).not.toBe(document.body)
    expect(document.activeElement).not.toBe(trigger)
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('has an aria-live region that reflects the current item position', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    const { open, next } = useLightbox()
    open(
      [{ type: 'image', src: '/a.jpg' }, { type: 'image', src: '/b.jpg' }],
      0,
    )
    await Promise.resolve()
    next()
    await Promise.resolve()
    const live = document.querySelector('[aria-live="polite"]')!
    expect(live.textContent).toContain('2')
  })

  it('dialog aria-label falls back to a generic label, not strings.close, when the item has no title', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    useLightbox().open(
      [{ type: 'image', src: '/a.jpg' }],
      0,
      { strings: { close: 'Schließen' } },
    )
    await Promise.resolve()
    const dialog = document.querySelector('.nuxt-lightbox__dialog')!
    expect(dialog.getAttribute('aria-label')).toBe('Lightbox')
  })

  it('dialog aria-label uses the active item title when present', async () => {
    mount(LightboxRoot, { attachTo: document.body })
    useLightbox().open(
      [{ type: 'image', src: '/a.jpg', title: 'Mountain view' }],
      0,
      { strings: { close: 'Schließen' } },
    )
    await Promise.resolve()
    const dialog = document.querySelector('.nuxt-lightbox__dialog')!
    expect(dialog.getAttribute('aria-label')).toBe('Mountain view')
  })
})
