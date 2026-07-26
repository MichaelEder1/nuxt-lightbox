import type { LightboxItem } from '../types'

export type TriggerGroupKey = string | symbol

interface TriggerEntry {
  el: HTMLElement
  item: LightboxItem
}

// Module-scoped singleton, same reasoning as state.ts: only ever mutated
// client-side (directive mounted/updated/unmounted hooks never run during
// SSR), so a plain module-level Map is safe.
const groups = new Map<TriggerGroupKey, TriggerEntry[]>()

export function registerTrigger(key: TriggerGroupKey, el: HTMLElement, item: LightboxItem): void {
  const list = groups.get(key) ?? []
  list.push({ el, item })
  groups.set(key, list)
}

export function unregisterTrigger(key: TriggerGroupKey, el: HTMLElement): void {
  const list = groups.get(key)
  if (!list) return
  const index = list.findIndex(entry => entry.el === el)
  if (index !== -1) list.splice(index, 1)
  if (list.length === 0) groups.delete(key)
}

export function updateTrigger(key: TriggerGroupKey, el: HTMLElement, item: LightboxItem): void {
  const entry = groups.get(key)?.find(entry => entry.el === el)
  if (entry) entry.item = item
}

export function getGroupItems(key: TriggerGroupKey): LightboxItem[] {
  return (groups.get(key) ?? []).map(entry => entry.item)
}

export function getIndexInGroup(key: TriggerGroupKey, el: HTMLElement): number {
  return (groups.get(key) ?? []).findIndex(entry => entry.el === el)
}
