// Type declarations for shared modules
// This is a temporary solution until shared packages are migrated to TypeScript

declare module 'shared/ReactSymbols' {
  export const REACT_CONTEXT_TYPE: symbol;
  export const REACT_ELEMENT_TYPE: symbol;
  export const REACT_FORWARD_REF_TYPE: symbol;
  export const REACT_FRAGMENT_TYPE: symbol;
  export const REACT_LAZY_TYPE: symbol;
  export const REACT_MEMO_TYPE: symbol;
  export const REACT_PORTAL_TYPE: symbol;
  export const REACT_PROFILER_TYPE: symbol;
  export const REACT_CONSUMER_TYPE: symbol;
  export const REACT_STRICT_MODE_TYPE: symbol;
  export const REACT_SUSPENSE_TYPE: symbol;
  export const REACT_SUSPENSE_LIST_TYPE: symbol;
  export const REACT_VIEW_TRANSITION_TYPE: symbol;
  export const REACT_SCOPE_TYPE: symbol;
  export const REACT_LEGACY_HIDDEN_TYPE: symbol;
  export const REACT_TRACING_MARKER_TYPE: symbol;
}

declare module 'shared/ReactFeatureFlags' {
  export const enableScopeAPI: boolean;
  export const enableTransitionTracing: boolean;
  export const enableLegacyHidden: boolean;
  export const enableViewTransition: boolean;
}
