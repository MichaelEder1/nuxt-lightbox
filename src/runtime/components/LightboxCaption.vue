<script setup lang="ts">
import { useLightbox } from '../composables/useLightbox'

const { activeItem, activeIndex } = useLightbox()
</script>

<template>
  <div v-if="activeItem" class="nuxt-lightbox__caption">
    <slot name="caption" :item="activeItem" :index="activeIndex">
      <h2 v-if="activeItem.title" class="nuxt-lightbox__title">{{ activeItem.title }}</h2>
      <p v-if="activeItem.description" class="nuxt-lightbox__description">{{ activeItem.description }}</p>
    </slot>
  </div>
</template>
