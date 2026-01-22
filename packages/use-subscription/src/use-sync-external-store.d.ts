// Type declarations for use-sync-external-store
declare module 'use-sync-external-store/shim' {
  export function useSyncExternalStore<T>(
    subscribe: (callback: () => void) => () => void,
    getSnapshot: () => T,
    getServerSnapshot?: () => T
  ): T;
}
