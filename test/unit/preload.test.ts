import { describe, it, expect, vi, beforeEach } from 'vitest'
import { preloadImage } from '../../src/runtime/internal/preload'

describe('preloadImage', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', class {
      src = ''
    })
  })

  it('creates an Image and sets its src to trigger a fetch', () => {
    const img = preloadImage('/next.jpg')
    expect(img.src).toBe('/next.jpg')
  })
})
