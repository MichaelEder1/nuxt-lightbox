<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLightbox } from '../composables/useLightbox'
import { useLightboxState } from '../internal/state'
import { getYoutubeEmbedUrl, getVimeoEmbedUrl } from '../internal/providers/embed-url'
import { createZoomPanController } from '../internal/zoom-pan'

const { activeItem, activeIndex, close } = useLightbox()
const state = useLightboxState()
const hasError = ref(false)
const zoomPan = createZoomPanController()
const videoRef = ref<HTMLVideoElement | null>(null)

// 1 = slide in from the right (moving forward), -1 = slide in from the
// left (moving backward). Picks whichever direction is the shorter way
// around the gallery, so wrapping past the last item via next() still
// reads as "forward" instead of snapping backward across the whole set.
const direction = ref<1 | -1>(1)
const transitionName = computed(() => `nuxt-lightbox-slide-${direction.value === 1 ? 'forward' : 'backward'}`)

watch(activeIndex, (newIndex, oldIndex) => {
  const total = state.items.length
  const forwardDistance = (newIndex - oldIndex + total) % total
  const backwardDistance = (oldIndex - newIndex + total) % total
  direction.value = forwardDistance <= backwardDistance ? 1 : -1

  hasError.value = false
  zoomPan.reset()
})

// `:muted` only sets the DOM *attribute*. Browsers key autoplay-with-sound-off
// behavior off the `muted` *property* instead, so the attribute alone isn't
// reliable — set the property imperatively once the (possibly newly
// remounted, see the `:key="activeIndex"` below) <video> element exists.
watch(videoRef, (el) => {
  if (el) {
    el.muted = !!activeItem.value?.muted
  }
}, { immediate: true, flush: 'post' })

function onError() {
  hasError.value = true
}

// The stage is a fixed-size frame that letterboxes smaller/narrower items
// (see theme.css) — without this, clicking the empty space around such an
// item hits the stage's own background and does nothing, since that space
// isn't covered by the backdrop *or* the media element. The `target ===
// currentTarget` guard keeps clicks on the media itself (or any of its
// zoom/pan handlers) from bubbling up and closing.
function onStageBackgroundClick(event: MouseEvent) {
  if (event.target !== event.currentTarget) return
  if (state.options.closeOnBackdrop !== false) {
    close()
  }
}

function onImagePointerDown(event: PointerEvent) {
  zoomPan.onPointerDown(event)
  if (zoomPan.scale.value > 1) {
    const target = event.target as Element | null
    target?.setPointerCapture?.(event.pointerId)
  }
}

const embedUrl = computed(() => {
  if (!activeItem.value) return null
  if (activeItem.value.type === 'youtube') return getYoutubeEmbedUrl(activeItem.value.src)
  if (activeItem.value.type === 'vimeo') return getVimeoEmbedUrl(activeItem.value.src)
  return null
})
</script>

<template>
  <div class="nuxt-lightbox__stage" @click="onStageBackgroundClick">
    <Transition :name="transitionName">
      <div v-if="hasError" :key="activeIndex" class="nuxt-lightbox__error">
        Unable to load this item.
      </div>
      <img
        v-else-if="activeItem && activeItem.type === 'image'"
        :key="activeIndex"
        class="nuxt-lightbox__media"
        :src="activeItem.src"
        :alt="activeItem.alt ?? ''"
        :style="{ transform: `translate(${zoomPan.translateX.value}px, ${zoomPan.translateY.value}px) scale(${zoomPan.scale.value})` }"
        @error="onError"
        @wheel="zoomPan.onWheel"
        @pointerdown="onImagePointerDown"
        @pointermove="zoomPan.onPointerMove"
        @pointerup="zoomPan.onPointerUp"
        @pointerleave="zoomPan.onPointerUp"
      >
      <video
        v-else-if="activeItem && activeItem.type === 'video'"
        ref="videoRef"
        :key="activeIndex"
        class="nuxt-lightbox__media"
        :src="activeItem.src"
        :poster="activeItem.poster"
        :autoplay="activeItem.autoplay"
        :muted="activeItem.muted"
        :loop="activeItem.loop"
        controls
        @error="onError"
      />
      <iframe
        v-else-if="embedUrl"
        :key="activeIndex"
        class="nuxt-lightbox__media nuxt-lightbox__media--embed"
        :src="embedUrl"
        :title="activeItem?.title ?? activeItem?.alt ?? 'Video'"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        frameborder="0"
      />
      <div v-else-if="activeItem && (activeItem.type === 'youtube' || activeItem.type === 'vimeo')" :key="activeIndex" class="nuxt-lightbox__error">
        Unable to load this video.
      </div>
    </Transition>
  </div>
</template>
