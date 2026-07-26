import { describe, it, expect } from 'vitest'
import { createZoomPanController } from '../../src/runtime/internal/zoom-pan'

function wheelEvent(deltaY: number) {
  return { deltaY, preventDefault: () => {} } as WheelEvent
}

describe('createZoomPanController', () => {
  it('starts at scale 1 with no translation', () => {
    const controller = createZoomPanController()
    expect(controller.scale.value).toBe(1)
    expect(controller.translateX.value).toBe(0)
    expect(controller.translateY.value).toBe(0)
  })

  it('onWheel with a negative deltaY (scroll up) increases scale', () => {
    const controller = createZoomPanController()
    controller.onWheel(wheelEvent(-100))
    expect(controller.scale.value).toBeGreaterThan(1)
  })

  it('onWheel with a positive deltaY (scroll down) decreases scale, clamped at a minimum of 1', () => {
    const controller = createZoomPanController()
    controller.onWheel(wheelEvent(100))
    expect(controller.scale.value).toBe(1)
  })

  it('scale is clamped at a maximum', () => {
    const controller = createZoomPanController()
    for (let i = 0; i < 50; i++) controller.onWheel(wheelEvent(-100))
    expect(controller.scale.value).toBeLessThanOrEqual(4)
  })

  it('reset() returns scale and translation to their initial values', () => {
    const controller = createZoomPanController()
    controller.onWheel(wheelEvent(-100))
    controller.reset()
    expect(controller.scale.value).toBe(1)
    expect(controller.translateX.value).toBe(0)
    expect(controller.translateY.value).toBe(0)
  })

  it('panning is a no-op while scale is 1 (nothing to pan)', () => {
    const controller = createZoomPanController()
    controller.onPointerDown({ clientX: 0, clientY: 0, pointerId: 1 } as PointerEvent)
    controller.onPointerMove({ clientX: 50, clientY: 50, pointerId: 1 } as PointerEvent)
    expect(controller.translateX.value).toBe(0)
    expect(controller.translateY.value).toBe(0)
  })

  it('panning moves translateX/translateY while zoomed in', () => {
    const controller = createZoomPanController()
    controller.onWheel(wheelEvent(-100)) // zoom in
    controller.onPointerDown({ clientX: 0, clientY: 0, pointerId: 1 } as PointerEvent)
    controller.onPointerMove({ clientX: 30, clientY: 20, pointerId: 1 } as PointerEvent)
    expect(controller.translateX.value).toBe(30)
    expect(controller.translateY.value).toBe(20)
  })

  it('clamps translateX/translateY to a bounded range instead of an unbounded drag delta', () => {
    const controller = createZoomPanController()
    for (let i = 0; i < 5; i++) controller.onWheel(wheelEvent(-100)) // zoom in several ticks
    const maxScale = controller.scale.value
    expect(maxScale).toBeGreaterThan(1)

    controller.onPointerDown({ clientX: 0, clientY: 0, pointerId: 1 } as PointerEvent)
    controller.onPointerMove({ clientX: 10000, clientY: 10000, pointerId: 1 } as PointerEvent)

    // Never allow a raw, unbounded delta through.
    expect(controller.translateX.value).toBeLessThan(10000)
    expect(controller.translateY.value).toBeLessThan(10000)

    // The clamp is a function of scale: (scale - 1) * BASE_CLAMP_FACTOR(200).
    const expectedMax = (maxScale - 1) * 200
    expect(controller.translateX.value).toBeCloseTo(expectedMax)
    expect(controller.translateY.value).toBeCloseTo(expectedMax)
  })

  it('clamps translation symmetrically in the negative direction too', () => {
    const controller = createZoomPanController()
    for (let i = 0; i < 5; i++) controller.onWheel(wheelEvent(-100)) // zoom in several ticks
    const maxScale = controller.scale.value

    controller.onPointerDown({ clientX: 0, clientY: 0, pointerId: 1 } as PointerEvent)
    controller.onPointerMove({ clientX: -10000, clientY: -10000, pointerId: 1 } as PointerEvent)

    const expectedMax = (maxScale - 1) * 200
    expect(controller.translateX.value).toBeCloseTo(-expectedMax)
    expect(controller.translateY.value).toBeCloseTo(-expectedMax)
  })

  it('re-clamps translation when zooming out reduces the allowed pan range', () => {
    const controller = createZoomPanController()
    for (let i = 0; i < 10; i++) controller.onWheel(wheelEvent(-100)) // zoom to max
    controller.onPointerDown({ clientX: 0, clientY: 0, pointerId: 1 } as PointerEvent)
    controller.onPointerMove({ clientX: 10000, clientY: 10000, pointerId: 1 } as PointerEvent)
    const translatedAtMaxScale = controller.translateX.value
    controller.onPointerUp()

    // Zoom out a step; the max allowed translate should shrink and the existing
    // (now out-of-range) translation should be pulled back in, never left dangling
    // beyond the new bound.
    controller.onWheel(wheelEvent(100))
    const newMax = (controller.scale.value - 1) * 200
    expect(controller.translateX.value).toBeLessThanOrEqual(translatedAtMaxScale)
    expect(controller.translateX.value).toBeLessThanOrEqual(newMax + 1e-6)
  })

  it('resets translation to 0 when zooming out reaches (or drifts past) MIN_SCALE', () => {
    const controller = createZoomPanController()
    controller.onWheel(wheelEvent(-100)) // zoom in one step
    controller.onPointerDown({ clientX: 0, clientY: 0, pointerId: 1 } as PointerEvent)
    controller.onPointerMove({ clientX: 40, clientY: 40, pointerId: 1 } as PointerEvent)
    expect(controller.translateX.value).not.toBe(0)

    controller.onWheel(wheelEvent(100)) // zoom back out to MIN_SCALE
    expect(controller.scale.value).toBe(1)
    expect(controller.translateX.value).toBe(0)
    expect(controller.translateY.value).toBe(0)
  })
})
