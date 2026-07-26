import { describe, it, expect, beforeEach } from 'vitest'
import { trapFocus } from '../../src/runtime/internal/focus-trap'

describe('trapFocus', () => {
  let container: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = ''
    container = document.createElement('div')
    container.innerHTML = `
      <button id="first">First</button>
      <button id="middle">Middle</button>
      <button id="last">Last</button>
    `
    document.body.appendChild(container)
  })

  it('activate() moves focus to the first focusable element', () => {
    const trap = trapFocus(container)
    trap.activate()
    expect(document.activeElement?.id).toBe('first')
    trap.deactivate()
  })

  it('Tab on the last element wraps focus to the first', () => {
    const trap = trapFocus(container)
    trap.activate()
    const last = document.getElementById('last')!
    last.focus()
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true })
    container.dispatchEvent(event)
    expect(document.activeElement?.id).toBe('first')
    trap.deactivate()
  })

  it('Shift+Tab on the first element wraps focus to the last', () => {
    const trap = trapFocus(container)
    trap.activate()
    const first = document.getElementById('first')!
    first.focus()
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true })
    container.dispatchEvent(event)
    expect(document.activeElement?.id).toBe('last')
    trap.deactivate()
  })
})
