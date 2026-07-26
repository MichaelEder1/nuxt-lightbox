import { describe, it, expect } from 'vitest'
import { getYoutubeEmbedUrl, getYoutubeId, getVimeoEmbedUrl } from '../../src/runtime/internal/providers/embed-url'

describe('getYoutubeId', () => {
  it('accepts a bare video ID', () => {
    expect(getYoutubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts the ID from a youtube.com/watch URL', () => {
    expect(getYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts the ID from a youtu.be short URL', () => {
    expect(getYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('returns null for an unparseable value', () => {
    expect(getYoutubeId('not-a-valid-id')).toBeNull()
  })
})

describe('getYoutubeEmbedUrl', () => {
  it('accepts a bare video ID', () => {
    expect(getYoutubeEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })

  it('extracts the ID from a youtube.com/watch URL', () => {
    expect(getYoutubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
      .toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })

  it('extracts the ID from a youtu.be short URL', () => {
    expect(getYoutubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ'))
      .toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })
})

describe('getVimeoEmbedUrl', () => {
  it('accepts a bare numeric ID', () => {
    expect(getVimeoEmbedUrl('76979871')).toBe('https://player.vimeo.com/video/76979871')
  })

  it('extracts the ID from a vimeo.com URL', () => {
    expect(getVimeoEmbedUrl('https://vimeo.com/76979871')).toBe('https://player.vimeo.com/video/76979871')
  })
})
