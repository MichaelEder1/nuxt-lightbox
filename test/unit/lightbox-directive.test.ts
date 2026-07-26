import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { vLightbox } from '../../src/runtime/directives/lightbox'
import { useLightbox } from '../../src/runtime/composables/useLightbox'
import { useLightboxState } from '../../src/runtime/internal/state'

function resetState() {
  const state = useLightboxState()
  state.items = []
  state.activeIndex = 0
  state.isOpen = false
  state.options = {}
  state.triggerElement = null
}

const directives = { lightbox: vLightbox }

// The `src`/`poster` DOM *properties* (as opposed to the raw attribute)
// always return the browser-resolved absolute URL — the directive reads
// `el.src`/`el.currentSrc` deliberately, for a genuinely loadable URL
// regardless of the trigger element's own base path. Test expectations
// need to match that resolution, not the raw relative path in the template.
function resolveUrl(path: string): string {
  return new URL(path, window.location.href).href
}

describe('v-lightbox directive', () => {
  beforeEach(resetState)

  it('derives type/src/alt from a plain <img> and opens it as a single-item gallery on click', async () => {
    const wrapper = mount({
      directives,
      template: `<img src="/photo.jpg" alt="A photo" v-lightbox />`,
    })
    await wrapper.find('img').trigger('click')

    const { isOpen, activeItem } = useLightbox()
    expect(isOpen.value).toBe(true)
    expect(activeItem.value).toEqual({ type: 'image', src: resolveUrl('/photo.jpg'), alt: 'A photo' })
  })

  it('derives type/src/poster/autoplay/muted/loop from a plain <video>', async () => {
    const wrapper = mount({
      directives,
      template: `<video src="/clip.mp4" poster="/poster.jpg" autoplay muted loop v-lightbox />`,
    })
    await wrapper.find('video').trigger('click')

    const { activeItem } = useLightbox()
    expect(activeItem.value).toEqual({
      type: 'video',
      src: resolveUrl('/clip.mp4'),
      // poster is read via getAttribute (see the directive's deriveItem),
      // so it stays as the raw attribute value, not resolved like src.
      poster: '/poster.jpg',
      autoplay: true,
      muted: true,
      loop: true,
    })
  })

  it('reads the title attribute and data-lightbox-description as caption fields', async () => {
    const wrapper = mount({
      directives,
      template: `<img src="/photo.jpg" title="My Title" data-lightbox-description="My description" v-lightbox />`,
    })
    await wrapper.find('img').trigger('click')

    const { activeItem } = useLightbox()
    expect(activeItem.value?.title).toBe('My Title')
    expect(activeItem.value?.description).toBe('My description')
  })

  it('groups elements sharing the same group string into one gallery, opening at the clicked index', async () => {
    const wrapper = mount({
      directives,
      template: `
        <div>
          <img src="/a.jpg" v-lightbox="'demo-group'" />
          <img src="/b.jpg" v-lightbox="'demo-group'" />
          <img src="/c.jpg" v-lightbox="'demo-group'" />
        </div>
      `,
    })
    const imgs = wrapper.findAll('img')
    await imgs[1]!.trigger('click')

    const { isOpen, activeIndex, activeItem } = useLightbox()
    expect(isOpen.value).toBe(true)
    expect(activeIndex.value).toBe(1)
    expect(activeItem.value?.src).toBe(resolveUrl('/b.jpg'))

    const state = useLightboxState()
    expect(state.items.map(i => i.src)).toEqual(['/a.jpg', '/b.jpg', '/c.jpg'].map(resolveUrl))
  })

  it('standalone elements (no group) never batch together, even when adjacent in the DOM', async () => {
    const wrapper = mount({
      directives,
      template: `
        <div>
          <img src="/a.jpg" v-lightbox />
          <img src="/b.jpg" v-lightbox />
        </div>
      `,
    })
    const imgs = wrapper.findAll('img')
    await imgs[0]!.trigger('click')

    const state = useLightboxState()
    expect(state.items).toEqual([{ type: 'image', src: resolveUrl('/a.jpg'), alt: undefined, title: undefined, description: undefined }])
  })

  it('the object binding form overrides/extends the auto-derived item', async () => {
    const wrapper = mount({
      directives,
      template: `<video src="/clip.mp4" loop v-lightbox="{ item: { title: 'Custom title', loop: false } }" />`,
    })
    await wrapper.find('video').trigger('click')

    const { activeItem } = useLightbox()
    expect(activeItem.value?.title).toBe('Custom title')
    // Explicit override wins over the auto-derived `loop` attribute.
    expect(activeItem.value?.loop).toBe(false)
    // Fields not in the override still come from the element.
    expect(activeItem.value?.src).toBe(resolveUrl('/clip.mp4'))
  })

  it('the object binding form can group AND override in the same binding', async () => {
    const wrapper = mount({
      directives,
      template: `
        <div>
          <img src="/a.jpg" v-lightbox="{ group: 'g' }" />
          <img src="/b.jpg" v-lightbox="{ group: 'g', item: { title: 'B title' } }" />
        </div>
      `,
    })
    const imgs = wrapper.findAll('img')
    await imgs[1]!.trigger('click')

    const { activeIndex, activeItem } = useLightbox()
    expect(activeIndex.value).toBe(1)
    expect(activeItem.value?.title).toBe('B title')
    const state = useLightboxState()
    expect(state.items).toHaveLength(2)
  })

  it('unmounting a grouped element removes it from the group, shifting later indices down', async () => {
    const wrapper = mount({
      directives,
      props: ['items'],
      template: `
        <div>
          <img v-for="src in items" :key="src" :src="src" v-lightbox="'shrinking-group'" />
        </div>
      `,
    }, {
      props: { items: ['/a.jpg', '/b.jpg', '/c.jpg'] },
    })

    await wrapper.setProps({ items: ['/a.jpg', '/c.jpg'] }) // removes /b.jpg
    const imgs = wrapper.findAll('img')
    expect(imgs).toHaveLength(2)
    await imgs[1]!.trigger('click') // should now be /c.jpg, at index 1

    const { activeIndex, activeItem } = useLightbox()
    expect(activeIndex.value).toBe(1)
    expect(activeItem.value?.src).toBe(resolveUrl('/c.jpg'))
    const state = useLightboxState()
    expect(state.items.map(i => i.src)).toEqual(['/a.jpg', '/c.jpg'].map(resolveUrl))
  })

  it('a v-for list whose data changes updates the registered item via the updated hook', async () => {
    const wrapper = mount({
      directives,
      props: ['title'],
      template: `<img src="/a.jpg" :title="title" v-lightbox="'update-group'" />`,
    }, {
      props: { title: 'Original' },
    })
    await wrapper.setProps({ title: 'Changed' })
    await wrapper.find('img').trigger('click')

    const { activeItem } = useLightbox()
    expect(activeItem.value?.title).toBe('Changed')
  })

  it('does nothing (no crash, no registration) on an element with no derivable or overridden type/src', async () => {
    const wrapper = mount({
      directives,
      template: `<div v-lightbox>not media</div>`,
    })
    await wrapper.find('div').trigger('click')

    const { isOpen } = useLightbox()
    expect(isOpen.value).toBe(false)
  })
})
