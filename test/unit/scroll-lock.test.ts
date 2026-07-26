import { describe, it, expect, afterEach } from 'vitest'
import { lockScroll, unlockScroll } from '../../src/runtime/internal/scroll-lock'

describe('scroll-lock', () => {
  afterEach(() => {
    // Reset the module's internal lock sentinel (not just the DOM style) so
    // tests remain independent of declaration order — the first test below
    // locks without a matching unlock, which would otherwise leave the
    // module "locked" for the next test.
    unlockScroll()
    document.body.style.overflow = ''
  })

  it('lockScroll sets body overflow to hidden', () => {
    lockScroll()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('unlockScroll restores the previous overflow value', () => {
    document.body.style.overflow = 'auto'
    lockScroll()
    unlockScroll()
    expect(document.body.style.overflow).toBe('auto')
  })
})
