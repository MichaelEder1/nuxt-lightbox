export function useRouter() {
  return {
    afterEach: (_fn: (...args: unknown[]) => void) => {},
  }
}

export function defineNuxtPlugin(fn: (...args: unknown[]) => unknown) {
  return fn
}

// Mutable so tests can simulate module-level nuxt.config.ts defaults
// (see Task 2's useLightbox() merge test and Task 3's real module.ts wiring).
export const runtimeConfigState: { public: { lightbox: Record<string, unknown> } } = {
  public: { lightbox: {} },
}

export function useRuntimeConfig() {
  return runtimeConfigState
}
