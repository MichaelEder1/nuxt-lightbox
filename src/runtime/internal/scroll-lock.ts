let previousOverflow: string | null = null

export function lockScroll() {
  if (previousOverflow !== null) return // already locked
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}

export function unlockScroll() {
  if (previousOverflow === null) return
  document.body.style.overflow = previousOverflow
  previousOverflow = null
}
