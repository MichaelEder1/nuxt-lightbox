<script setup lang="ts">
import { computed } from 'vue'
import { useLightbox } from '../composables/useLightbox'
import { useLightboxState } from '../internal/state'

const { next, prev, close, activeIndex, activeItem } = useLightbox()
const state = useLightboxState()

const counterText = computed(() => {
  const template = state.options.strings?.counterTemplate ?? '{current} / {total}'
  return template
    .replaceAll('{current}', String(activeIndex.value + 1))
    .replaceAll('{total}', String(state.items.length))
})

const mergedActions = computed(() => [
  ...(state.options.actions ?? []),
  ...(activeItem.value?.actions ?? []),
])

function runAction(action: (typeof mergedActions.value)[number]) {
  if (!activeItem.value) return
  action.onClick(activeItem.value, activeIndex.value)
}
</script>

<template>
  <div class="nuxt-lightbox__toolbar">
    <button
      type="button"
      class="nuxt-lightbox__close"
      :aria-label="state.options.strings?.close ?? 'Close'"
      @click="close"
    >
      <svg class="nuxt-lightbox__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
    <button
      v-for="action in mergedActions"
      :key="action.id"
      type="button"
      class="nuxt-lightbox__action-btn"
      :data-action-id="action.id"
      :aria-label="action.label"
      @click="runAction(action)"
    >
      <component :is="action.icon" v-if="action.icon && typeof action.icon !== 'string'" class="nuxt-lightbox__icon" />
      <span v-else-if="action.icon" class="nuxt-lightbox__icon" :class="action.icon" />
      <template v-else>{{ action.label }}</template>
    </button>
  </div>

  <button
    type="button"
    class="nuxt-lightbox__prev"
    :aria-label="state.options.strings?.previous ?? 'Previous'"
    @click="prev"
  >
    <svg class="nuxt-lightbox__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
  </button>
  <button
    type="button"
    class="nuxt-lightbox__next"
    :aria-label="state.options.strings?.next ?? 'Next'"
    @click="next"
  >
    <svg class="nuxt-lightbox__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6" /></svg>
  </button>

  <span class="nuxt-lightbox__counter">{{ counterText }}</span>
</template>
