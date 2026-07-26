const SWIPE_THRESHOLD = 60

interface SwipeCallbacks {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onSwipeDown: () => void
}

export function createSwipeHandler(callbacks: SwipeCallbacks) {
  let startX = 0
  let startY = 0
  // Tracks whether a touchstart with a valid touch point was actually seen.
  // Without this, a touchend that fires with no prior touchstart (or after
  // it was already consumed) would compute a delta against stale/zeroed
  // startX/startY and could spuriously cross SWIPE_THRESHOLD, firing an
  // unintended swipe callback (e.g. closing the lightbox).
  let isDragging = false

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    if (!touch) return
    startX = touch.clientX
    startY = touch.clientY
    isDragging = true
  }

  function onTouchMove(_event: TouchEvent) {
    // Reserved for future drag-preview feedback; no-op for now.
  }

  function onTouchEnd(event: TouchEvent) {
    if (!isDragging) return
    isDragging = false

    const touch = event.changedTouches[0]
    if (!touch) return
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY

    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > SWIPE_THRESHOLD) {
      callbacks.onSwipeDown()
      return
    }

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0) {
        callbacks.onSwipeLeft()
      } else {
        callbacks.onSwipeRight()
      }
    }
  }

  return { onTouchStart, onTouchMove, onTouchEnd }
}
