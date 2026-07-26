import { ref } from 'vue'

const MIN_SCALE = 1
const MAX_SCALE = 4
const ZOOM_STEP = 0.2
// Approximates half of a typical stage dimension (in px). Since this controller has no
// access to the actual rendered image/container size, pan distance is clamped as a
// proportion of scale rather than against real DOM measurements: for a centered,
// object-fit: contain-style image the amount it can move before its edge reaches the
// container edge is ((scale - 1) / 2) * containerSize. Using containerSize ~= 2 * this
// constant keeps the image from ever being dragged fully off-stage without requiring
// zoom-pan.ts to take on DOM/component coupling.
const BASE_CLAMP_FACTOR = 200

export function createZoomPanController() {
  const scale = ref(1)
  const translateX = ref(0)
  const translateY = ref(0)

  let isPanning = false
  let panStartX = 0
  let panStartY = 0
  let panOriginX = 0
  let panOriginY = 0

  function clampScale(value: number) {
    return Math.min(Math.max(value, MIN_SCALE), MAX_SCALE)
  }

  function clampTranslate(value: number) {
    const maxTranslate = (scale.value - 1) * BASE_CLAMP_FACTOR
    return Math.min(Math.max(value, -maxTranslate), maxTranslate)
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault()
    const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
    const nextScale = clampScale(scale.value + delta)
    scale.value = nextScale
    if (nextScale <= MIN_SCALE) {
      translateX.value = 0
      translateY.value = 0
    }
    else {
      translateX.value = clampTranslate(translateX.value)
      translateY.value = clampTranslate(translateY.value)
    }
  }

  function onPointerDown(event: PointerEvent) {
    if (scale.value <= MIN_SCALE) return
    isPanning = true
    panStartX = event.clientX
    panStartY = event.clientY
    panOriginX = translateX.value
    panOriginY = translateY.value
  }

  function onPointerMove(event: PointerEvent) {
    if (!isPanning) return
    translateX.value = clampTranslate(panOriginX + (event.clientX - panStartX))
    translateY.value = clampTranslate(panOriginY + (event.clientY - panStartY))
  }

  function onPointerUp() {
    isPanning = false
  }

  function reset() {
    scale.value = 1
    translateX.value = 0
    translateY.value = 0
    isPanning = false
  }

  return { scale, translateX, translateY, onWheel, onPointerDown, onPointerMove, onPointerUp, reset }
}
