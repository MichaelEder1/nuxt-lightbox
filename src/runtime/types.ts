import type { Component } from 'vue'

export type LightboxMediaType = 'image' | 'video' | 'youtube' | 'vimeo'

export interface LightboxAction {
  id: string
  icon?: string | Component
  label: string
  onClick: (item: LightboxItem, index: number) => void
}

export interface LightboxItem {
  type: LightboxMediaType
  src: string
  thumbnail?: string
  title?: string
  description?: string
  alt?: string
  actions?: LightboxAction[]
  poster?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
}

export interface LightboxStrings {
  close?: string
  next?: string
  previous?: string
  /** Format string with `{current}` and `{total}` tokens, e.g. '{current} / {total}'. */
  counterTemplate?: string
}

export interface LightboxOptions {
  actions?: LightboxAction[]
  loop?: boolean
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  closeOnRouteChange?: boolean
  /** Show the thumbnail strip for multi-item galleries. Defaults to `true`. */
  thumbnails?: boolean
  strings?: LightboxStrings
  /**
   * Name of the Vue <Transition> to use for the dialog's enter/leave
   * animation. Defaults to 'nuxt-lightbox-fade'. Pass a custom name paired
   * with your own `.your-name-enter-active` / `.your-name-leave-active` CSS
   * classes to fully replace the default animation — see Task 15.
   */
  transitionName?: string
  onOpen?: (item: LightboxItem, index: number) => void
  onClose?: () => void
  onNavigate?: (item: LightboxItem, index: number) => void
}
