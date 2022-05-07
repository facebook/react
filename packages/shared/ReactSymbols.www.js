/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'

import {enableSymbolFallbackForWWW} from './ReactFeatureFlags';

const usePolyfill =
  enableSymbolFallbackForWWW && (typeof Symbol !== 'function' || !Symbol.for);

// The Symbol used to tag the ReactElement-like types.
export const REACT_ELEMENT_TYPE = usePolyfill
  ? 0xeac7
  : Symbol.for('react.element');
export const REACT_PORTAL_TYPE = usePolyfill
  ? 0xeaca
  : Symbol.for('react.portal');
export const REACT_FRAGMENT_TYPE = usePolyfill
  ? 0xeacb
  : Symbol.for('react.fragment');
export const REACT_STRICT_MODE_TYPE = usePolyfill
  ? 0xeacc
  : Symbol.for('react.strict_mode');
export const REACT_PROFILER_TYPE = usePolyfill
  ? 0xead2
  : Symbol.for('react.profiler');
export const REACT_PROVIDER_TYPE = usePolyfill
  ? 0xeacd
  : Symbol.for('react.provider');
export const REACT_CONTEXT_TYPE = usePolyfill
  ? 0xeace
  : Symbol.for('react.context');
export const REACT_SERVER_CONTEXT_TYPE = usePolyfill
  ? 0xeae6
  : Symbol.for('react.server_context');
export const REACT_FORWARD_REF_TYPE = usePolyfill
  ? 0xead0
  : Symbol.for('react.forward_ref');
export const REACT_SUSPENSE_TYPE = usePolyfill
  ? 0xead1
  : Symbol.for('react.suspense');
export const REACT_SUSPENSE_LIST_TYPE = usePolyfill
  ? 0xead8
  : Symbol.for('react.suspense_list');
export const REACT_MEMO_TYPE = usePolyfill ? 0xead3 : Symbol.for('react.memo');
export const REACT_LAZY_TYPE = usePolyfill ? 0xead4 : Symbol.for('react.lazy');
export const REACT_SCOPE_TYPE = usePolyfill
  ? 0xead7
  : Symbol.for('react.scope');
export const REACT_DEBUG_TRACING_MODE_TYPE = usePolyfill
  ? 0xeae1
  : Symbol.for('react.debug_trace_mode');
export const REACT_OFFSCREEN_TYPE = usePolyfill
  ? 0xeae2
  : Symbol.for('react.offscreen');
export const REACT_LEGACY_HIDDEN_TYPE = usePolyfill
  ? 0xeae3
  : Symbol.for('react.legacy_hidden');
export const REACT_CACHE_TYPE = usePolyfill
  ? 0xeae4
  : Symbol.for('react.cache');
export const REACT_TRACING_MARKER_TYPE = usePolyfill
  ? 0xeae5
  : Symbol.for('react.tracing_marker');
export const REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = usePolyfill
  ? 0xeae7
  : Symbol.for('react.default_value');
const MAYBE_ITERATOR_SYMBOL = usePolyfill
  ? typeof Symbol === 'function' && Symbol.iterator
  : Symbol.iterator;

const FAUX_ITERATOR_SYMBOL = '@@iterator';

export function getIteratorFn(maybeIterable: ?any): ?() => ?Iterator<*> {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }
  const maybeIterator =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable[FAUX_ITERATOR_SYMBOL];
  if (typeof maybeIterator === 'function') {
    return maybeIterator;
  }
  return null;
}
