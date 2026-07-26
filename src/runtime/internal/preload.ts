export function preloadImage(src: string): HTMLImageElement {
  const img = new Image()
  img.src = src
  return img
}
