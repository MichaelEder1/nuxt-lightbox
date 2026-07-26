import type { LightboxItem } from '../types'
import { getYoutubeId } from './providers/embed-url'

/**
 * Resolves the `<img>` src to use for a thumbnail strip entry.
 *
 * `item.src` is only a valid `<img>` source for `type: 'image'` items — for
 * `video`/`youtube`/`vimeo` it's a video file URL, a YouTube ID/URL, or a
 * Vimeo ID/URL, none of which render as an image. This picks a type-aware
 * fallback instead of rendering a broken image:
 *  - `item.thumbnail`, if provided, always wins.
 *  - `youtube`: derive the standard `hqdefault.jpg` thumbnail from the
 *    parsed video ID.
 *  - `video`: fall back to `item.poster`, if provided.
 *  - otherwise (vimeo with no thumbnail, video with no poster): fall back
 *    to `item.src` as a last resort, matching prior behavior.
 */
export function getThumbnailSrc(item: LightboxItem): string {
  if (item.thumbnail) return item.thumbnail

  if (item.type === 'youtube') {
    const id = getYoutubeId(item.src)
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  }

  if (item.type === 'video' && item.poster) {
    return item.poster
  }

  return item.src
}
