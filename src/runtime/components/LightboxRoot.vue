<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { useLightbox } from '../composables/useLightbox'
import { useLightboxState } from '../internal/state'
import { lockScroll, unlockScroll } from '../internal/scroll-lock'
import { createSwipeHandler } from '../internal/gestures'
import { preloadImage } from '../internal/preload'
import { trapFocus } from '../internal/focus-trap'
import LightboxControls from './LightboxControls.vue'
import LightboxThumbnails from './LightboxThumbnails.vue'
import LightboxStage from './LightboxStage.vue'
import LightboxCaption from './LightboxCaption.vue'

const { isOpen, activeIndex, activeItem, close, next, prev } = useLightbox()
const state = useLightboxState()

const dialogRef = ref<HTMLElement | null>(null)
let focusTrap: ReturnType<typeof trapFocus> | null = null

const swipe = createSwipeHandler({
  onSwipeLeft: () => next(),
  onSwipeRight: () => prev(),
  onSwipeDown: () => close(),
})

// Custom `caption`/action content can legitimately contain text inputs
// (see the caption slot in LightboxCaption.vue) — without this guard,
// using arrow keys to move the text cursor inside one would also
// navigate the gallery underneath it. Escape is exempt: closing on Esc
// from within a focused form control is expected modal behavior.
function isTextEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && state.options.closeOnEsc !== false) {
    close()
    return
  }
  if (isTextEditable(event.target)) return
  if (event.key === 'ArrowRight') {
    next()
  } else if (event.key === 'ArrowLeft') {
    prev()
  }
}

// Also bound to the dialog itself (see template) so clicking the empty
// space around a letterboxed/narrower item still closes — without the
// `target === currentTarget` guard, a click anywhere inside the dialog
// (including directly on the image) would bubble up and close it.
function onBackdropClick(event: MouseEvent) {
  if (event.target !== event.currentTarget) return
  if (state.options.closeOnBackdrop !== false) {
    close()
  }
}

watch(isOpen, (open) => {
  if (open) {
    lockScroll()
    document.addEventListener('keydown', onKeydown)
    if (dialogRef.value) {
      focusTrap = trapFocus(dialogRef.value)
      focusTrap.activate()
    }
  } else {
    unlockScroll()
    document.removeEventListener('keydown', onKeydown)
    focusTrap?.deactivate()
    focusTrap = null
  }
}, { flush: 'post' })

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  unlockScroll()
})

watch(activeIndex, () => {
  const items = state.items
  const nextItem = items[activeIndex.value + 1]
  const prevItem = items[activeIndex.value - 1]
  if (nextItem?.type === 'image') preloadImage(nextItem.src)
  if (prevItem?.type === 'image') preloadImage(prevItem.src)
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <Transition :name="state.options.transitionName ?? 'nuxt-lightbox-fade'" appear>
      <div v-if="isOpen" class="nuxt-lightbox">
        <div class="nuxt-lightbox__backdrop" @click="onBackdropClick" />
        <div
          ref="dialogRef"
          class="nuxt-lightbox__dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="activeItem?.title ?? 'Lightbox'"
          @click="onBackdropClick"
          @touchstart="swipe.onTouchStart"
          @touchmove="swipe.onTouchMove"
          @touchend="swipe.onTouchEnd"
        >
          <LightboxControls />
          <LightboxStage />
          <LightboxCaption />
          <LightboxThumbnails v-if="state.items.length > 1 && state.options.thumbnails !== false" />
          <div class="nuxt-lightbox__sr-only" aria-live="polite">
            {{ activeItem ? `${activeIndex + 1} of ${state.items.length}` : '' }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
