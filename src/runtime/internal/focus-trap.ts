const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function trapFocus(container: HTMLElement) {
  function getFocusable(): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return
    const focusable = getFocusable()
    if (focusable.length === 0) return
    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function activate() {
    container.addEventListener('keydown', onKeydown)
    getFocusable()[0]?.focus()
  }

  function deactivate() {
    container.removeEventListener('keydown', onKeydown)
  }

  return { activate, deactivate }
}
