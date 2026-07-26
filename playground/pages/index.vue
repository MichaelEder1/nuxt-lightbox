<script setup lang="ts">
import { computed, h, reactive, ref } from 'vue'
import type { LightboxItem, LightboxOptions } from '../../src/runtime/types'

// Demo-only icon components, matching the same SVG style as the module's
// own built-in close/prev/next icons (viewBox 0 0 24 24, stroke currentColor).
const DownloadIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}, [h('path', { d: 'M12 4v11m0 0l-4-4m4 4l4-4M5 19h14' })])

const ShareIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}, [
  h('circle', { cx: 18, cy: 5, r: 3 }),
  h('circle', { cx: 6, cy: 12, r: 3 }),
  h('circle', { cx: 18, cy: 19, r: 3 }),
  h('line', { x1: 8.59, y1: 13.51, x2: 15.42, y2: 17.49 }),
  h('line', { x1: 15.41, y1: 6.51, x2: 8.59, y2: 10.49 }),
])
const StarIcon = () => h('svg', {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}, [h('polygon', { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' })])

function download(item: LightboxItem) {
  const link = document.createElement('a')
  link.href = item.src
  link.download = item.title ?? ''
  link.rel = 'noopener'
  link.click()
}

async function share(item: LightboxItem) {
  const shareData = { title: item.title ?? 'Shared from nuxt-lightbox', url: item.src }
  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch {
      // User cancelled the share sheet — not an error.
    }
    return
  }
  await navigator.clipboard.writeText(item.src)
  alert('Link copied to clipboard (no native share sheet available in this browser).')
}

// ---------------------------------------------------------------------------
// Gallery builder — every LightboxItem field and every LightboxOptions field
// is driven by a control below, so any combination can be exercised without
// touching code.
// ---------------------------------------------------------------------------

const pool = reactive({
  landscape: true,
  portrait: true,
  broken: false,
  video: true,
  videoAutoplay: true,
  videoMuted: true,
  videoLoop: true,
  youtube: true,
  vimeo: false,
  withCaptions: true,
  withGlobalActions: true,
  withPerItemAction: false,
})

const opts = reactive({
  loop: true,
  closeOnBackdrop: true,
  closeOnEsc: true,
  closeOnRouteChange: true,
  thumbnails: true,
  customStrings: false,
  closeLabel: 'Dismiss',
  nextLabel: 'Forward',
  previousLabel: 'Back',
  counterTemplate: '{current} of {total}',
  transition: 'default' as 'default' | 'zoom',
  callbacks: true,
})

const startIndex = ref(0)

const log = ref<string[]>([])
function pushLog(line: string) {
  const time = new Date().toLocaleTimeString([], { hour12: false })
  log.value.unshift(`[${time}] ${line}`)
  if (log.value.length > 30) log.value.length = 30
}
function clearLog() {
  log.value = []
}

const builtItems = computed<LightboxItem[]>(() => {
  const items: LightboxItem[] = []
  const caption = (title: string, description?: string) =>
    pool.withCaptions ? { title, description } : {}

  if (pool.landscape) {
    items.push({
      type: 'image',
      src: 'https://picsum.photos/1920/1080',
      alt: 'Countryside road',
      ...caption('Countryside Road', 'A wide landscape shot, used to check the caption layout under the image.'),
    })
  }
  if (pool.portrait) {
    items.push({
      type: 'image',
      src: 'https://picsum.photos/id/1027/700/1000',
      alt: 'Portrait orientation sample',
      ...caption('Portrait Orientation'),
    })
  }
  if (pool.broken) {
    items.push({
      type: 'image',
      src: 'https://example.invalid/missing.jpg',
      thumbnail: 'https://picsum.photos/id/1016/200/150',
      alt: 'Intentionally broken image',
      ...caption('Broken Image', 'This src is invalid on purpose — exercises the error state.'),
    })
  }
  if (pool.video) {
    items.push({
      type: 'video',
      src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      poster: 'https://picsum.photos/id/1015/800/600',
      autoplay: pool.videoAutoplay,
      muted: pool.videoMuted,
      loop: pool.videoLoop,
      ...caption('Self-hosted Video'),
    })
  }
  if (pool.youtube) {
    items.push({
      type: 'youtube',
      src: 'dQw4w9WgXcQ',
      ...caption('YouTube Embed'),
    })
  }
  if (pool.vimeo) {
    items.push({
      type: 'vimeo',
      src: '76979871',
      ...caption('Vimeo Embed'),
    })
  }
  if (pool.withPerItemAction && items.length > 0) {
    items[0]!.actions = [{ id: 'favorite', icon: StarIcon, label: 'Favorite', onClick: i => pushLog(`favorite clicked on "${i.title ?? i.type}"`) }]
  }
  return items
})

const clampedStartIndex = computed(() =>
  builtItems.value.length === 0 ? 0 : Math.min(startIndex.value, builtItems.value.length - 1))

const { open } = useLightbox()

function openConfigured() {
  if (builtItems.value.length === 0) {
    pushLog('No items selected — check at least one item type below.')
    return
  }
  const options: LightboxOptions = {
    loop: opts.loop,
    closeOnBackdrop: opts.closeOnBackdrop,
    closeOnEsc: opts.closeOnEsc,
    closeOnRouteChange: opts.closeOnRouteChange,
    thumbnails: opts.thumbnails,
    transitionName: opts.transition === 'zoom' ? 'playground-zoom' : undefined,
    strings: opts.customStrings
      ? {
          close: opts.closeLabel,
          next: opts.nextLabel,
          previous: opts.previousLabel,
          counterTemplate: opts.counterTemplate,
        }
      : undefined,
    actions: pool.withGlobalActions
      ? [
          { id: 'download', icon: DownloadIcon, label: 'Download', onClick: download },
          { id: 'share', icon: ShareIcon, label: 'Share', onClick: share },
        ]
      : undefined,
  }
  if (opts.callbacks) {
    options.onOpen = (item, index) => pushLog(`onOpen → index ${index}, "${item.title ?? item.type}"`)
    options.onClose = () => pushLog('onClose')
    options.onNavigate = (item, index) => pushLog(`onNavigate → index ${index}, "${item.title ?? item.type}"`)
  }
  open(builtItems.value, clampedStartIndex.value, options)
}

// Mirrors openConfigured() above field-for-field, but as displayable source
// instead of a real call — functions (actions, callbacks) can't round-trip
// through a string, so those show as short placeholder comments instead.
const generatedCode = computed(() => {
  const itemLines = builtItems.value.map((item) => {
    const fields = [`type: '${item.type}'`, `src: '${item.src}'`]
    if (item.alt) fields.push(`alt: '${item.alt}'`)
    if (item.title) fields.push(`title: '${item.title}'`)
    if (item.description) fields.push(`description: '${item.description}'`)
    if (item.thumbnail) fields.push(`thumbnail: '${item.thumbnail}'`)
    if (item.poster) fields.push(`poster: '${item.poster}'`)
    if (item.autoplay) fields.push('autoplay: true')
    if (item.muted) fields.push('muted: true')
    if (item.loop) fields.push('loop: true')
    if (item.actions?.length) fields.push(`actions: [${item.actions.map(a => `/* ${a.label} */`).join(', ')}]`)
    return `  { ${fields.join(', ')} },`
  })

  const optionLines = [
    `  loop: ${opts.loop},`,
    `  closeOnBackdrop: ${opts.closeOnBackdrop},`,
    `  closeOnEsc: ${opts.closeOnEsc},`,
    `  closeOnRouteChange: ${opts.closeOnRouteChange},`,
    `  thumbnails: ${opts.thumbnails},`,
  ]
  if (opts.transition === 'zoom') optionLines.push('  transitionName: \'playground-zoom\',')
  if (pool.withGlobalActions) optionLines.push('  actions: [/* download */, /* share */],')
  if (opts.customStrings) {
    optionLines.push(
      '  strings: {',
      `    close: '${opts.closeLabel}',`,
      `    next: '${opts.nextLabel}',`,
      `    previous: '${opts.previousLabel}',`,
      `    counterTemplate: '${opts.counterTemplate}',`,
      '  },',
    )
  }
  if (opts.callbacks) {
    optionLines.push(
      '  onOpen: (item, index) => { /* ... */ },',
      '  onClose: () => { /* ... */ },',
      '  onNavigate: (item, index) => { /* ... */ },',
    )
  }

  const itemsBlock = itemLines.length > 0 ? `\n${itemLines.join('\n')}\n` : ''
  return `const { open } = useLightbox()

open([${itemsBlock}], ${clampedStartIndex.value}, {
${optionLines.join('\n')}
})`
})

const codeCopied = ref(false)
async function copyGeneratedCode() {
  await navigator.clipboard.writeText(generatedCode.value)
  codeCopied.value = true
  setTimeout(() => { codeCopied.value = false }, 1600)
}

function resetToDefaults() {
  Object.assign(pool, {
    landscape: true,
    portrait: true,
    broken: false,
    video: true,
    videoAutoplay: true,
    videoMuted: true,
    videoLoop: true,
    youtube: true,
    vimeo: false,
    withCaptions: true,
    withGlobalActions: true,
    withPerItemAction: false,
  })
  Object.assign(opts, {
    loop: true,
    closeOnBackdrop: true,
    closeOnEsc: true,
    closeOnRouteChange: true,
    thumbnails: true,
    customStrings: false,
    closeLabel: 'Dismiss',
    nextLabel: 'Forward',
    previousLabel: 'Back',
    counterTemplate: '{current} of {total}',
    transition: 'default',
    callbacks: true,
  })
  startIndex.value = 0
}

const directivePhotos = [
  { src: 'https://picsum.photos/id/1018/600/400', alt: 'Mountain valley', title: 'Mountain Valley' },
  { src: 'https://picsum.photos/id/1025/600/400', alt: 'A dog', title: 'A Very Good Dog' },
  { src: 'https://picsum.photos/id/1035/600/400', alt: 'Foggy road', title: 'Foggy Road' },
  { src: 'https://picsum.photos/id/1043/600/400', alt: 'Desert dunes', title: 'Desert Dunes' },
]
</script>

<template>
  <div class="page">
    <h1>nuxt-lightbox playground</h1>
    <p><NuxtLink to="/other">Other page (route-change cleanup check)</NuxtLink></p>

    <h2>Gallery builder</h2>
    <p class="hint">Every <code>LightboxItem</code> and <code>LightboxOptions</code> field is wired to a control below — toggle any combination, then open.</p>

    <div class="panels">
      <fieldset class="panel">
        <legend>Items</legend>
        <label><input v-model="pool.landscape" type="checkbox"> Landscape image (with caption)</label>
        <label><input v-model="pool.portrait" type="checkbox"> Portrait image</label>
        <label><input v-model="pool.broken" type="checkbox"> Broken image (error state)</label>
        <label><input v-model="pool.video" type="checkbox"> Self-hosted video</label>
        <div v-if="pool.video" class="sub">
          <label><input v-model="pool.videoAutoplay" type="checkbox"> autoplay</label>
          <label><input v-model="pool.videoMuted" type="checkbox"> muted</label>
          <label><input v-model="pool.videoLoop" type="checkbox"> loop</label>
        </div>
        <label><input v-model="pool.youtube" type="checkbox"> YouTube embed</label>
        <label><input v-model="pool.vimeo" type="checkbox"> Vimeo embed</label>
        <hr>
        <label><input v-model="pool.withCaptions" type="checkbox"> Include title/description</label>
        <label><input v-model="pool.withGlobalActions" type="checkbox"> Global actions (download + share)</label>
        <label><input v-model="pool.withPerItemAction" type="checkbox"> Per-item action on first item (favorite)</label>
        <label class="start-index">
          Start index
          <input v-model.number="startIndex" type="number" min="0" :max="Math.max(builtItems.length - 1, 0)">
          <span class="hint">({{ builtItems.length }} item{{ builtItems.length === 1 ? '' : 's' }} selected)</span>
        </label>
      </fieldset>

      <fieldset class="panel">
        <legend>Options</legend>
        <label><input v-model="opts.loop" type="checkbox"> loop</label>
        <label><input v-model="opts.closeOnBackdrop" type="checkbox"> closeOnBackdrop</label>
        <label><input v-model="opts.closeOnEsc" type="checkbox"> closeOnEsc</label>
        <label><input v-model="opts.closeOnRouteChange" type="checkbox"> closeOnRouteChange (navigate to "Other page" to check)</label>
        <label><input v-model="opts.thumbnails" type="checkbox"> thumbnails (only visible with 2+ items)</label>
        <label><input v-model="opts.callbacks" type="checkbox"> Log onOpen / onNavigate / onClose below</label>

        <hr>
        <label>
          Transition
          <select v-model="opts.transition">
            <option value="default">default (nuxt-lightbox-fade)</option>
            <option value="zoom">custom demo transition (playground-zoom)</option>
          </select>
        </label>

        <hr>
        <label><input v-model="opts.customStrings" type="checkbox"> Custom strings</label>
        <div v-if="opts.customStrings" class="sub">
          <label>close <input v-model="opts.closeLabel" type="text"></label>
          <label>next <input v-model="opts.nextLabel" type="text"></label>
          <label>previous <input v-model="opts.previousLabel" type="text"></label>
          <label>counterTemplate <input v-model="opts.counterTemplate" type="text"></label>
        </div>
      </fieldset>
    </div>

    <div class="actions">
      <button type="button" class="primary" @click="openConfigured">Open configured gallery</button>
      <button type="button" @click="resetToDefaults">Reset to defaults</button>
    </div>

    <div class="code-preview">
      <div class="code-preview__header">
        <strong>Generated code</strong>
        <button type="button" @click="copyGeneratedCode">{{ codeCopied ? 'Copied' : 'Copy' }}</button>
      </div>
      <pre><code>{{ generatedCode }}</code></pre>
    </div>

    <div class="log">
      <div class="log__header">
        <strong>Event log</strong>
        <button type="button" @click="clearLog">Clear</button>
      </div>
      <p v-if="log.length === 0" class="hint">No events yet — enable callbacks above and open a gallery.</p>
      <ul v-else>
        <li v-for="(line, i) in log" :key="i">{{ line }}</li>
      </ul>
    </div>

    <h2>v-lightbox directive demo</h2>

    <p>Standalone (opens just this one image):</p>
    <img
      v-lightbox
      src="https://picsum.photos/id/1041/300/200"
      alt="Standalone demo image"
      title="Standalone image"
      style="width: 150px; cursor: pointer;"
    >

    <p>Grouped (click any thumbnail to open the whole row as a gallery):</p>
    <div style="display: flex; gap: 8px;">
      <img
        v-for="photo in directivePhotos"
        :key="photo.src"
        v-lightbox="'directive-demo-group'"
        :src="photo.src"
        :alt="photo.alt"
        :title="photo.title"
        style="width: 120px; height: 90px; object-fit: cover; cursor: pointer;"
      >
    </div>

    <p>Object form (forces type/src that can't be auto-derived, e.g. a YouTube embed behind a thumbnail):</p>
    <img
      v-lightbox="{ item: { type: 'youtube', src: 'dQw4w9WgXcQ', title: 'YouTube via directive' } }"
      src="https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
      alt="YouTube demo thumbnail"
      style="width: 150px; cursor: pointer;"
    >
  </div>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1.25rem 5rem;
  font-family: system-ui, sans-serif;
}

h2 {
  margin-top: 2.5rem;
}

.hint {
  color: #666;
  font-size: 0.85rem;
}

.panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 640px) {
  .panels {
    grid-template-columns: 1fr;
  }
}

.panel {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem 1rem 1rem;
}

.panel legend {
  font-weight: 600;
  padding: 0 0.35rem;
}

.panel label {
  display: block;
  font-size: 0.9rem;
  margin: 0.4rem 0;
}

.panel select,
.panel input[type='text'] {
  margin-left: 0.35rem;
}

.panel .sub {
  margin-left: 1.4rem;
  padding-left: 0.6rem;
  border-left: 2px solid #eee;
}

.panel hr {
  border: none;
  border-top: 1px solid #eee;
  margin: 0.6rem 0;
}

.start-index input[type='number'] {
  width: 4.5rem;
  margin: 0 0.4rem;
}

.actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 1.25rem;
}

.actions button {
  padding: 0.55rem 1.1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 0.9rem;
}

.actions button.primary {
  background: #222;
  color: #fff;
  border-color: #222;
}

.log,
.code-preview {
  margin-top: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  background: #fafafa;
}

.log__header,
.code-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.log__header button,
.code-preview__header button {
  font-size: 0.8rem;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
}

.code-preview {
  background: #1e1e1e;
  border-color: #333;
}

.code-preview__header strong {
  color: #eee;
}

.code-preview__header button {
  background: #333;
  color: #eee;
  border: 1px solid #444;
  border-radius: 4px;
}

.code-preview pre {
  margin: 0.6rem 0 0;
  overflow-x: auto;
}

.code-preview code {
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  color: #d4d4d4;
  white-space: pre;
}

.log ul {
  margin: 0.5rem 0 0;
  padding-left: 1.1rem;
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
  max-height: 220px;
  overflow-y: auto;
}
</style>

<style>
/* Global (unscoped) on purpose: the lightbox overlay mounts into its own
   client-only Vue app appended outside this page's component tree, so a
   `scoped` style block here could never reach `.nuxt-lightbox`. This is the
   "custom demo transition" selectable in the Options panel above — a
   playground-only example of the transitionName override documented for
   consumers, distinct from the module's own default `nuxt-lightbox-fade`. */
.playground-zoom-enter-active,
.playground-zoom-leave-active {
  transition: opacity 500ms ease;
}

.playground-zoom-enter-from,
.playground-zoom-leave-to {
  opacity: 0;
}

.playground-zoom-enter-active .nuxt-lightbox__stage,
.playground-zoom-leave-active .nuxt-lightbox__stage {
  transition: transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.playground-zoom-enter-from .nuxt-lightbox__stage,
.playground-zoom-leave-to .nuxt-lightbox__stage {
  transform: scale(0.5) rotate(-6deg);
}
</style>
