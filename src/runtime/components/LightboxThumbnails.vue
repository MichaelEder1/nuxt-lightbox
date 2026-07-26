<script setup lang="ts">
import { useLightbox } from '../composables/useLightbox'
import { useLightboxState } from '../internal/state'
import { getThumbnailSrc } from '../internal/thumbnail-src'

const { goTo, activeIndex } = useLightbox()
const state = useLightboxState()
</script>

<template>
  <div class="nuxt-lightbox__thumbnails">
    <button
      v-for="(item, index) in state.items"
      :key="item.src + index"
      type="button"
      class="nuxt-lightbox__thumbnail"
      :class="{ 'nuxt-lightbox__thumbnail--active': index === activeIndex }"
      :aria-label="item.title ?? `Go to item ${index + 1}`"
      @click="goTo(index)"
    >
      <img :src="getThumbnailSrc(item)" alt="">
    </button>
  </div>
</template>
