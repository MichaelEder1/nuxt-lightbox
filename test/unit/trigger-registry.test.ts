import { describe, it, expect, beforeEach } from 'vitest'
import {
  registerTrigger,
  unregisterTrigger,
  updateTrigger,
  getGroupItems,
  getIndexInGroup,
} from '../../src/runtime/internal/trigger-registry'
import type { LightboxItem } from '../../src/runtime/types'

function makeItem(src: string): LightboxItem {
  return { type: 'image', src }
}

describe('trigger-registry', () => {
  // Registry is a module-level singleton, so use a fresh, unique key per
  // test to avoid cross-test bleed rather than trying to "reset" it.
  let key: symbol
  beforeEach(() => {
    key = Symbol('test-group')
  })

  it('registers entries in registration order and exposes their items', () => {
    const elA = document.createElement('img')
    const elB = document.createElement('img')
    registerTrigger(key, elA, makeItem('/a.jpg'))
    registerTrigger(key, elB, makeItem('/b.jpg'))
    expect(getGroupItems(key)).toEqual([makeItem('/a.jpg'), makeItem('/b.jpg')])
  })

  it('getIndexInGroup returns the registration-order index of a given element', () => {
    const elA = document.createElement('img')
    const elB = document.createElement('img')
    const elC = document.createElement('img')
    registerTrigger(key, elA, makeItem('/a.jpg'))
    registerTrigger(key, elB, makeItem('/b.jpg'))
    registerTrigger(key, elC, makeItem('/c.jpg'))
    expect(getIndexInGroup(key, elB)).toBe(1)
  })

  it('getIndexInGroup returns -1 for an element that was never registered', () => {
    const elA = document.createElement('img')
    const stray = document.createElement('img')
    registerTrigger(key, elA, makeItem('/a.jpg'))
    expect(getIndexInGroup(key, stray)).toBe(-1)
  })

  it('unregisterTrigger removes exactly the given element, shifting later indices down', () => {
    const elA = document.createElement('img')
    const elB = document.createElement('img')
    const elC = document.createElement('img')
    registerTrigger(key, elA, makeItem('/a.jpg'))
    registerTrigger(key, elB, makeItem('/b.jpg'))
    registerTrigger(key, elC, makeItem('/c.jpg'))
    unregisterTrigger(key, elB)
    expect(getGroupItems(key)).toEqual([makeItem('/a.jpg'), makeItem('/c.jpg')])
    expect(getIndexInGroup(key, elC)).toBe(1)
  })

  it('unregistering the last entry in a group cleans it up (empty group, not a lingering empty array)', () => {
    const elA = document.createElement('img')
    registerTrigger(key, elA, makeItem('/a.jpg'))
    unregisterTrigger(key, elA)
    expect(getGroupItems(key)).toEqual([])
    expect(getIndexInGroup(key, elA)).toBe(-1)
  })

  it('updateTrigger replaces the item for an already-registered element without changing its position', () => {
    const elA = document.createElement('img')
    const elB = document.createElement('img')
    registerTrigger(key, elA, makeItem('/a.jpg'))
    registerTrigger(key, elB, makeItem('/b.jpg'))
    updateTrigger(key, elA, makeItem('/a-updated.jpg'))
    expect(getGroupItems(key)).toEqual([makeItem('/a-updated.jpg'), makeItem('/b.jpg')])
  })

  it('different group keys are fully independent', () => {
    const otherKey = Symbol('other-group')
    const elA = document.createElement('img')
    const elB = document.createElement('img')
    registerTrigger(key, elA, makeItem('/a.jpg'))
    registerTrigger(otherKey, elB, makeItem('/b.jpg'))
    expect(getGroupItems(key)).toEqual([makeItem('/a.jpg')])
    expect(getGroupItems(otherKey)).toEqual([makeItem('/b.jpg')])
  })
})
