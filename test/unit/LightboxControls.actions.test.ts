import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import LightboxControls from '../../src/runtime/components/LightboxControls.vue'
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

describe('LightboxControls actions', () => {
  beforeEach(resetState)

  it('renders global default actions from open() options', () => {
    const onClick = vi.fn()
    useLightbox().open(
      [{ type: 'image', src: '/a.jpg' }],
      0,
      { actions: [{ id: 'share', label: 'Share', onClick }] },
    )
    const wrapper = mount(LightboxControls)
    const btn = wrapper.find('[data-action-id="share"]')
    expect(btn.exists()).toBe(true)
  })

  it('renders per-item actions in addition to global actions', () => {
    const globalClick = vi.fn()
    const itemClick = vi.fn()
    useLightbox().open(
      [{ type: 'image', src: '/a.jpg', actions: [{ id: 'flag', label: 'Flag', onClick: itemClick }] }],
      0,
      { actions: [{ id: 'share', label: 'Share', onClick: globalClick }] },
    )
    const wrapper = mount(LightboxControls)
    expect(wrapper.find('[data-action-id="share"]').exists()).toBe(true)
    expect(wrapper.find('[data-action-id="flag"]').exists()).toBe(true)
  })

  it('calls the action onClick with the active item and index when clicked', async () => {
    const onClick = vi.fn()
    useLightbox().open(
      [{ type: 'image', src: '/a.jpg' }, { type: 'image', src: '/b.jpg' }],
      1,
      { actions: [{ id: 'share', label: 'Share', onClick }] },
    )
    const wrapper = mount(LightboxControls)
    await wrapper.find('[data-action-id="share"]').trigger('click')
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ src: '/b.jpg' }), 1)
  })

  it('renders the label as visible text when no icon is given', () => {
    useLightbox().open(
      [{ type: 'image', src: '/a.jpg' }],
      0,
      { actions: [{ id: 'share', label: 'Share', onClick: vi.fn() }] },
    )
    const wrapper = mount(LightboxControls)
    const btn = wrapper.find('[data-action-id="share"]')
    expect(btn.text()).toBe('Share')
  })

  it('renders a Component icon instead of the label text when icon is a component', () => {
    const ShareIcon = { name: 'ShareIcon', render: () => h('svg', { class: 'share-icon-mark' }) }
    useLightbox().open(
      [{ type: 'image', src: '/a.jpg' }],
      0,
      { actions: [{ id: 'share', icon: ShareIcon, label: 'Share', onClick: vi.fn() }] },
    )
    const wrapper = mount(LightboxControls)
    const btn = wrapper.find('[data-action-id="share"]')
    expect(btn.find('svg.share-icon-mark').exists()).toBe(true)
    expect(btn.text()).toBe('')
    // The label is still the accessible name for screen readers even though it's not visible text.
    expect(btn.attributes('aria-label')).toBe('Share')
  })

  it('renders a string icon as a class-based icon slot instead of the label text', () => {
    useLightbox().open(
      [{ type: 'image', src: '/a.jpg' }],
      0,
      { actions: [{ id: 'share', icon: 'i-my-icon-set-share', label: 'Share', onClick: vi.fn() }] },
    )
    const wrapper = mount(LightboxControls)
    const btn = wrapper.find('[data-action-id="share"]')
    expect(btn.find('.i-my-icon-set-share').exists()).toBe(true)
    expect(btn.text()).toBe('')
  })
})
