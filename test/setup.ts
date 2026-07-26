import { afterEach } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

// Component tests mount against the shared module-level lightbox state
// singleton (see src/runtime/internal/state.ts). If a wrapper from a
// previous test is left mounted, its reactive effects keep firing when a
// later test mutates that shared state, patching against DOM nodes that
// were already torn down between tests — crashing with errors like
// "Cannot read properties of null (reading 'insertBefore')". Auto-unmount
// after every test avoids that cross-test bleed-through.
enableAutoUnmount(afterEach)
