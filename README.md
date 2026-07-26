# nuxt-lightbox

A typed, SSR-safe lightbox module for Nuxt 3/4. Add it to your modules list
and call `useLightbox().open(...)` — no component to register, no client-only
wrapper to remember, no hydration-mismatch risk to worry about.

## Why

A lightbox overlay is awkward to get right in an SSR app: if you render it as
part of your page tree, its content (which item is open, if any) usually
depends on client-only state, which is exactly the kind of thing that causes
server/client markup mismatches during hydration. `nuxt-lightbox` sidesteps
this by mounting its overlay into its own client-only Vue app via a Nuxt
plugin — it never exists in the server-rendered HTML at all, so there's
nothing to mismatch. You just call a composable; the overlay, focus
management, keyboard/gesture handling, and route-change cleanup are all
handled for you.

## Features

- **`v-lightbox` directive** — annotate an `<img>`/`<video>` already in your
  template instead of building a `LightboxItem[]` by hand; group elements
  together for multi-item galleries
- **Gallery navigation** — next/prev/goTo, arrow-key navigation, and
  swipe gestures on touch devices
- **Multiple media types** — images, native `<video>`, YouTube, and Vimeo
  (embedded via the privacy-respecting `youtube-nocookie.com` domain)
- **Captions** — title/description per item, overridable via a `caption`
  slot
- **Custom actions** — buttons (icon + label + click handler) attached
  globally or per item
- **Zoom & pan for images** — mouse-wheel zoom and pointer-drag panning
  (no touch pinch-to-zoom yet)
- **Accessibility** — focus-trapped modal dialog (`role="dialog"`,
  `aria-modal`), Escape to close, an `aria-live` region announcing position,
  and focus restored to the triggering element on close
- **SSR-safe by construction** — the overlay is mounted client-only; there
  is no server-rendered markup for it to hydrate
- **Auto-close on route change** — configurable, on by default
- **Thumbnail strip** — shown automatically for multi-item galleries, with
  type-aware fallback thumbnails (see below) when you don't provide one
- **Adjacent-image preloading** for snappier navigation
- **Respects `prefers-reduced-motion`**
- **Fully typed**, zero runtime CSS-in-JS — one small stylesheet you can
  fully replace

## Install

```bash
npm install nuxt-lightbox
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-lightbox'],
})
```

Requires Nuxt `>=3.0.0` (Nuxt 3 and 4 are both supported).

## Basic usage

`useLightbox()` is auto-imported — call it from any component:

```vue
<script setup lang="ts">
const { open } = useLightbox()

function showGallery() {
  open(
    [
      { type: 'image', src: '/photos/1.jpg', alt: 'A mountain lake' },
      { type: 'image', src: '/photos/2.jpg', alt: 'A forest trail' },
      {
        type: 'video',
        src: '/videos/clip.mp4',
        poster: '/videos/clip-poster.jpg',
        title: 'Behind the scenes',
      },
      { type: 'youtube', src: 'dQw4w9WgXcQ', title: 'A YouTube video' },
    ],
    0, // start index
    { loop: true }, // per-call options (see below)
  )
}
</script>

<template>
  <button @click="showGallery">Open gallery</button>
</template>
```

### The composable

```ts
const {
  open,        // (items: LightboxItem[], startIndex?: number, options?: LightboxOptions) => void
  close,       // () => void
  next,        // () => void
  prev,        // () => void
  goTo,        // (index: number) => void
  isOpen,      // ComputedRef<boolean>
  activeIndex, // ComputedRef<number>
  activeItem,  // ComputedRef<LightboxItem | undefined>
} = useLightbox()
```

`open()` is a no-op if `items` is empty, and clamps `startIndex` into range.

### `v-lightbox` directive (declarative usage)

For the common case — an `<img>`/`<video>` already in your template that should
just open itself on click — `useLightbox()` is more ceremony than the job
needs. `v-lightbox` reads the same fields a hand-written `LightboxItem` would
set, straight off the element, so it behaves identically to the composable
form:

```vue
<template>
  <!-- Standalone: opens just this one image -->
  <img src="/photos/1.jpg" alt="A mountain lake" v-lightbox />

  <!-- Video attributes (poster/autoplay/muted/loop) are read the same way -->
  <video src="/videos/clip.mp4" poster="/poster.jpg" muted loop v-lightbox />

  <!-- Grouped: elements sharing a group string open together as one gallery,
       starting at whichever one was clicked -->
  <img
    v-for="photo in photos"
    :key="photo.src"
    :src="photo.src"
    :alt="photo.alt"
    v-lightbox="'trip-photos'"
  />

  <!-- Object form: group and/or override/extend the auto-derived item -->
  <img
    :src="photo.src"
    v-lightbox="{ group: 'trip-photos', item: { title: photo.caption } }"
  />
</template>
```

Elements bound without a group string are always independent — two
standalone `v-lightbox` images next to each other never accidentally batch
into a shared gallery with each other.

**What gets auto-derived:**
- `<img>` → `type: 'image'`, `src` (from `currentSrc`, so `srcset`-selected
  images resolve correctly), `alt`
- `<video>` → `type: 'video'`, `src`, `poster`, `autoplay`, `muted`, `loop`
- Any element → `title` from the `title` attribute, `description` from a
  `data-lightbox-description` attribute
- Any other element (or a type the auto-detection can't infer) requires the
  object form with an explicit `item: { type, src }` — the directive warns
  in dev mode and does nothing on click if neither is available

The object form's `item` always wins over the auto-derived fields it
overlaps with; anything it doesn't set still comes from the element. Dynamic
lists (`v-for` over fetched data) are fully supported — items update and
re-register correctly as the underlying data changes.

## `LightboxItem`

```ts
interface LightboxItem {
  type: 'image' | 'video' | 'youtube' | 'vimeo'
  src: string          // image/video file URL, or a YouTube/Vimeo ID or URL
  thumbnail?: string   // explicit thumbnail-strip image; see fallback below
  title?: string
  description?: string
  alt?: string
  actions?: LightboxAction[]
  poster?: string      // video poster image
  autoplay?: boolean   // video only
  muted?: boolean      // video only
  loop?: boolean       // video only
}

interface LightboxAction {
  id: string
  icon?: string | Component
  label: string
  onClick: (item: LightboxItem, index: number) => void
}
```

`src` for `youtube`/`vimeo` items accepts a bare video ID or a full URL
(`youtube.com/watch?v=...`, `youtu.be/...`, `vimeo.com/...`).

**Thumbnail fallback:** if `thumbnail` is omitted, the thumbnail strip falls
back to something type-appropriate instead of trying to render `src`
directly as an image: a YouTube item derives its `hqdefault.jpg` thumbnail
from the video ID, a `video` item falls back to `poster` if set, and
anything else (a `vimeo` item, or a `video` with no `poster`) falls back to
`src` as a last resort.

**Action `icon`:** pass a Vue component (rendered via `<component :is>`) or a
string (rendered as an empty `<span>` with that string as its class — the
convention used by class-based icon systems like Iconify's UnoCSS/Tailwind
integration, e.g. `icon: 'i-heroicons-arrow-down-tray'`). If `icon` is
omitted, the button falls back to showing `label` as visible text. Either
way, `label` is always the button's accessible name (`aria-label`).

## `LightboxOptions` (per-call)

Passed as the third argument to `open()`:

```ts
interface LightboxOptions {
  actions?: LightboxAction[]        // shown alongside any per-item actions
  loop?: boolean                    // wrap around at the first/last item
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
  closeOnRouteChange?: boolean
  thumbnails?: boolean              // show the thumbnail strip (2+ items only) — default true
  strings?: LightboxStrings
  transitionName?: string           // see "Custom transition" below
  onOpen?: (item: LightboxItem, index: number) => void
  onClose?: () => void
  onNavigate?: (item: LightboxItem, index: number) => void
}

interface LightboxStrings {
  close?: string
  next?: string
  previous?: string
  /** Format string with `{current}` and `{total}` tokens, e.g. '{current} / {total}'. */
  counterTemplate?: string
}
```

## Module-level config

Set defaults for every `open()` call in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-lightbox'],
  lightbox: {
    theme: 'default',        // 'default' | 'none' — see Styling below
    loop: true,              // wraps at the first/last item; set false to clamp instead
    closeOnBackdrop: true,
    closeOnEsc: true,
    closeOnRouteChange: true,
    thumbnails: true,
    strings: {
      close: 'Close',
      next: 'Next',
      previous: 'Previous',
      counterTemplate: '{current} / {total}',
    },
  },
})
```

Only JSON-serializable options can go here — **`actions`, `onOpen`,
`onClose`, and `onNavigate` are functions and cannot be set in
`nuxt.config.ts`**; pass them per-call to `open()` instead. Any option
passed to `open()` overrides the module-level default for that call.

## Styling

The default theme is a plain stylesheet built entirely from CSS custom
properties, so you can restyle it without overriding selectors — just
redeclare the variables you want to change. (The one exception is the
`prefers-reduced-motion: reduce` block, which uses `!important` to
guarantee transitions/animations are actually disabled for users who
request reduced motion, even against more specific overrides.)

```css
:root {
  --nl-accent-color: #ff5a5f;
  --nl-control-bg: rgba(0, 0, 0, 0.5);
}
```

| Variable | Default | Used for |
|---|---|---|
| `--nl-z-index` | `1000` | Overlay stacking order |
| `--nl-spacing` | `1rem` | General gap/padding |
| `--nl-border-radius` | `10px` | Media corner radius |
| `--nl-backdrop-bg` | `rgba(18, 18, 20, 0.86)` | Backdrop color |
| `--nl-backdrop-blur` | `12px` | Backdrop `backdrop-filter: blur()` |
| `--nl-fg-color` | `#fff` | Primary text/icon color |
| `--nl-muted-color` | `rgba(255, 255, 255, 0.55)` | Secondary text (description, counter) |
| `--nl-accent-color` | `#fff` | Active-thumbnail border color |
| `--nl-control-size` | `44px` | Prev/next/close/action button size |
| `--nl-control-radius` | `10px` | Control button corner radius |
| `--nl-control-bg` | `rgba(255, 255, 255, 0.08)` | Control button background |
| `--nl-control-bg-hover` | `rgba(255, 255, 255, 0.14)` | Control button hover background |
| `--nl-thumbnail-size` | `64px` | Thumbnail width/height |
| `--nl-thumbnail-radius` | `6px` | Thumbnail corner radius |
| `--nl-thumbnail-gap` | `8px` | Gap between thumbnails |
| `--nl-thumbnail-active-border` | `2px solid var(--nl-accent-color)` | Active thumbnail border |
| `--nl-transition-duration` | `320ms` | Dialog/control transition duration |
| `--nl-transition-easing` | `cubic-bezier(0.16, 1, 0.3, 1)` | Dialog/control transition easing |

If you'd rather write your own theme from scratch, disable the default one
and target the BEM class names directly:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-lightbox'],
  lightbox: { theme: 'none' },
})
```

```
.nuxt-lightbox                    root overlay
.nuxt-lightbox__backdrop
.nuxt-lightbox__dialog
.nuxt-lightbox__stage
.nuxt-lightbox__media             img / video / iframe
.nuxt-lightbox__media--embed      youtube/vimeo iframe modifier
.nuxt-lightbox__error
.nuxt-lightbox__caption
.nuxt-lightbox__title
.nuxt-lightbox__description
.nuxt-lightbox__toolbar           wraps close + action buttons, top-right
.nuxt-lightbox__prev
.nuxt-lightbox__next
.nuxt-lightbox__close
.nuxt-lightbox__action-btn
.nuxt-lightbox__icon              svg/span inside prev/next/close/action-btn
.nuxt-lightbox__counter
.nuxt-lightbox__thumbnails
.nuxt-lightbox__thumbnail
.nuxt-lightbox__thumbnail--active
.nuxt-lightbox__sr-only
```

(Note: `theme: 'none'` only skips registering the module's stylesheet — it
does not remove these class names from the rendered markup.)

### Custom transition

The whole overlay (backdrop + dialog together, so nothing pops in/out
independently) fades via a Vue `<Transition>` named `nuxt-lightbox-fade` by
default — the stage additionally scales in/out, nested inside the same
enter/leave window. Pass `transitionName` to fully replace it with your own
CSS transition/animation classes:

```ts
useLightbox().open(items, 0, { transitionName: 'my-lightbox' })
```

```css
.my-lightbox-enter-active,
.my-lightbox-leave-active {
  transition: opacity 300ms ease;
}
.my-lightbox-enter-from,
.my-lightbox-leave-to {
  opacity: 0;
}
```
