import { describe, it, expect, beforeEach } from 'vitest'
import { useLightbox } from '../../src/runtime/composables/useLightbox'
import { useLightboxState } from '../../src/runtime/internal/state'
import { runtimeConfigState } from '../stubs/nuxt-app'
import type { LightboxItem } from '../../src/runtime/types'

const items: LightboxItem[] = [
  { type: 'image', src: '/a.jpg', alt: 'a' },
  { type: 'image', src: '/b.jpg', alt: 'b' },
  { type: 'image', src: '/c.jpg', alt: 'c' },
]

function resetState() {
  const state = useLightboxState()
  state.items = []
  state.activeIndex = 0
  state.isOpen = false
  state.options = {}
  state.triggerElement = null
  runtimeConfigState.public.lightbox = {}
}

describe('useLightbox', () => {
  beforeEach(() => {
    resetState()
  })

  it('open() sets items, clamps startIndex, and sets isOpen', () => {
    const { open, isOpen, activeIndex, activeItem } = useLightbox()
    open(items, 1)
    expect(isOpen.value).toBe(true)
    expect(activeIndex.value).toBe(1)
    expect(activeItem.value).toEqual(items[1])
  })

  it('open() clamps an out-of-range startIndex into bounds', () => {
    const { open, activeIndex } = useLightbox()
    open(items, 99)
    expect(activeIndex.value).toBe(2)
  })

  it('open() with an empty array is a no-op', () => {
    const { open, isOpen } = useLightbox()
    open([], 0)
    expect(isOpen.value).toBe(false)
  })

  it('close() sets isOpen to false and calls onClose', () => {
    const { open, close, isOpen } = useLightbox()
    let closed = false
    open(items, 0, { onClose: () => { closed = true } })
    close()
    expect(isOpen.value).toBe(false)
    expect(closed).toBe(true)
  })

  it('next()/prev() move the active index without wrapping when loop is false', () => {
    const { open, next, prev, activeIndex } = useLightbox()
    open(items, 0, { loop: false })
    prev()
    expect(activeIndex.value).toBe(0) // clamped, no wrap
    next()
    next()
    expect(activeIndex.value).toBe(2)
    next()
    expect(activeIndex.value).toBe(2) // clamped at end
  })

  it('next()/prev() wrap around when loop is true', () => {
    const { open, next, prev, activeIndex } = useLightbox()
    open(items, 2, { loop: true })
    next()
    expect(activeIndex.value).toBe(0)
    prev()
    expect(activeIndex.value).toBe(2)
  })

  it('next() calls onNavigate with the new item and index', () => {
    const { open, next } = useLightbox()
    const calls: Array<[LightboxItem, number]> = []
    open(items, 0, { onNavigate: (item, index) => calls.push([item, index]) })
    next()
    expect(calls).toEqual([[items[1], 1]])
  })

  it('open() called again fully replaces the previous item set', () => {
    const { open, activeItem } = useLightbox()
    open(items, 0)
    const newItems: LightboxItem[] = [{ type: 'image', src: '/z.jpg', alt: 'z' }]
    open(newItems, 0)
    expect(activeItem.value).toEqual(newItems[0])
  })

  it('open() merges module-level defaults from runtimeConfig with per-call options, call-site options winning', () => {
    runtimeConfigState.public.lightbox = { loop: true, closeOnEsc: false }
    const { open } = useLightbox()
    open(items, 0, { closeOnEsc: true })
    const state = useLightboxState()
    expect(state.options.loop).toBe(true) // from module-level defaults, not overridden
    expect(state.options.closeOnEsc).toBe(true) // per-call option wins over module default
  })

  it('goTo() jumps directly to a given index, clamped to bounds', () => {
    const { open, goTo, activeIndex } = useLightbox()
    open(items, 0)
    goTo(2)
    expect(activeIndex.value).toBe(2)
    goTo(99)
    expect(activeIndex.value).toBe(2) // clamped, no loop by default
  })
})
