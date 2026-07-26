import { describe, it, expect, vi } from 'vitest'
import { createSwipeHandler } from '../../src/runtime/internal/gestures'

function touch(x: number, y: number) {
  return { touches: [{ clientX: x, clientY: y }] } as unknown as TouchEvent
}

function touchEnd(x: number, y: number) {
  return { changedTouches: [{ clientX: x, clientY: y }] } as unknown as TouchEvent
}

describe('createSwipeHandler', () => {
  it('fires onSwipeLeft for a leftward horizontal swipe past the threshold', () => {
    const onSwipeLeft = vi.fn()
    const handler = createSwipeHandler({ onSwipeLeft, onSwipeRight: vi.fn(), onSwipeDown: vi.fn() })
    handler.onTouchStart(touch(300, 100))
    handler.onTouchEnd(touchEnd(200, 105))
    expect(onSwipeLeft).toHaveBeenCalledOnce()
  })

  it('fires onSwipeRight for a rightward horizontal swipe past the threshold', () => {
    const onSwipeRight = vi.fn()
    const handler = createSwipeHandler({ onSwipeLeft: vi.fn(), onSwipeRight, onSwipeDown: vi.fn() })
    handler.onTouchStart(touch(100, 100))
    handler.onTouchEnd(touchEnd(220, 95))
    expect(onSwipeRight).toHaveBeenCalledOnce()
  })

  it('fires onSwipeDown for a downward vertical swipe past the threshold', () => {
    const onSwipeDown = vi.fn()
    const handler = createSwipeHandler({ onSwipeLeft: vi.fn(), onSwipeRight: vi.fn(), onSwipeDown })
    handler.onTouchStart(touch(100, 100))
    handler.onTouchEnd(touchEnd(105, 250))
    expect(onSwipeDown).toHaveBeenCalledOnce()
  })

  it('does not fire any callback for a small movement under the threshold', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const onSwipeDown = vi.fn()
    const handler = createSwipeHandler({ onSwipeLeft, onSwipeRight, onSwipeDown })
    handler.onTouchStart(touch(100, 100))
    handler.onTouchEnd(touchEnd(110, 105))
    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
    expect(onSwipeDown).not.toHaveBeenCalled()
  })

  it('is a no-op for a touchend with no prior touchstart, even past the threshold', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const onSwipeDown = vi.fn()
    const handler = createSwipeHandler({ onSwipeLeft, onSwipeRight, onSwipeDown })
    // No onTouchStart call — startX/startY would still be 0, which is far
    // enough from this touchend's coordinates to cross SWIPE_THRESHOLD if
    // the missing-touchstart guard were absent.
    handler.onTouchEnd(touchEnd(300, 100))
    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
    expect(onSwipeDown).not.toHaveBeenCalled()
  })

  it('ignores a second touchend after the drag was already consumed', () => {
    const onSwipeLeft = vi.fn()
    const handler = createSwipeHandler({ onSwipeLeft, onSwipeRight: vi.fn(), onSwipeDown: vi.fn() })
    handler.onTouchStart(touch(300, 100))
    handler.onTouchEnd(touchEnd(200, 105))
    expect(onSwipeLeft).toHaveBeenCalledOnce()

    // A stray second touchend (no matching touchstart) must not fire again.
    handler.onTouchEnd(touchEnd(50, 100))
    expect(onSwipeLeft).toHaveBeenCalledOnce()
  })

  it('does not throw and is a no-op when touchstart/touchend carry no touch points', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const onSwipeDown = vi.fn()
    const handler = createSwipeHandler({ onSwipeLeft, onSwipeRight, onSwipeDown })
    const emptyStart = { touches: [] } as unknown as TouchEvent
    const emptyEnd = { changedTouches: [] } as unknown as TouchEvent
    expect(() => {
      handler.onTouchStart(emptyStart)
      handler.onTouchEnd(emptyEnd)
    }).not.toThrow()
    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
    expect(onSwipeDown).not.toHaveBeenCalled()
  })
})
