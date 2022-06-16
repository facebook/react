/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  REACT_CONTEXT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_PROFILER_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_DEBUG_TRACING_MODE_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
  REACT_MEMO_TYPE,
  REACT_LAZY_TYPE,
  REACT_SCOPE_TYPE,
  REACT_LEGACY_HIDDEN_TYPE,
  REACT_OFFSCREEN_TYPE,
  REACT_CACHE_TYPE,
  REACT_TRACING_MARKER_TYPE,
} from 'shared/ReactSymbols';
import {
  enableScopeAPI,
  enableCacheElement,
  enableTransitionTracing,
  enableDebugTracing,
  enableLegacyHidden,
  enableSymbolFallbackForWWW,
} from './ReactFeatureFlags';

let REACT_MODULE_REFERENCE;
if (enableSymbolFallbackForWWW) {
  if (typeof Symbol === 'function') {
    REACT_MODULE_REFERENCE = Symbol.for('react.module.reference');
  } else {
    REACT_MODULE_REFERENCE = 0;
  }
} else {
  REACT_MODULE_REFERENCE = Symbol.for('react.module.reference');
}

export default function isValidElementType(type: mixed) {
  if (typeof type === 'string' || typeof type === 'function') {
    return true;
  }

  // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).
  if (
    type === REACT_FRAGMENT_TYPE ||
    type === REACT_PROFILER_TYPE ||
    (enableDebugTracing && type === REACT_DEBUG_TRACING_MODE_TYPE) ||
    type === REACT_STRICT_MODE_TYPE ||
    type === REACT_SUSPENSE_TYPE ||
    type === REACT_SUSPENSE_LIST_TYPE ||
    (enableLegacyHidden && type === REACT_LEGACY_HIDDEN_TYPE) ||
    type === REACT_OFFSCREEN_TYPE ||
    (enableScopeAPI && type === REACT_SCOPE_TYPE) ||
    (enableCacheElement && type === REACT_CACHE_TYPE) ||
    (enableTransitionTracing && type === REACT_TRACING_MARKER_TYPE)
  ) {
    return true;
  }

  if (typeof type === 'object' && type !== null) {
    if (
      type.$$typeof === REACT_LAZY_TYPE ||
      type.$$typeof === REACT_MEMO_TYPE ||
      type.$$typeof === REACT_PROVIDER_TYPE ||
      type.$$typeof === REACT_CONTEXT_TYPE ||
      type.$$typeof === REACT_FORWARD_REF_TYPE ||
      // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      type.$$typeof === REACT_MODULE_REFERENCE ||
      type.getModuleId !== undefined
    ) {
      return true;
    }
  }

  return false;
}
