/**
 * Extracts the 11-character YouTube video ID from a bare ID, a
 * youtube.com/watch URL, or a youtu.be short URL. Shared by
 * `getYoutubeEmbedUrl` (iframe src) and the thumbnail fallback in
 * `internal/thumbnail-src.ts`, which both need the ID rather than a
 * ready-made embed URL.
 */
export function getYoutubeId(src: string): string | null {
  if (/^[\w-]{11}$/.test(src)) {
    return src
  }
  const watchMatch = src.match(/[?&]v=([\w-]{11})/)
  if (watchMatch) {
    return watchMatch[1]!
  }
  const shortMatch = src.match(/youtu\.be\/([\w-]{11})/)
  if (shortMatch) {
    return shortMatch[1]!
  }
  return null
}

export function getYoutubeEmbedUrl(src: string): string | null {
  const id = getYoutubeId(src)
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
}

export function getVimeoEmbedUrl(src: string): string | null {
  if (/^\d+$/.test(src)) {
    return `https://player.vimeo.com/video/${src}`
  }
  const match = src.match(/vimeo\.com\/(\d+)/)
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}`
  }
  return null
}
