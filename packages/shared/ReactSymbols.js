/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'

// The Symbol used to tag the ReactElement-like types.
export const REACT_ELEMENT_TYPE: symbol = Symbol.for('react.element');
export const REACT_PORTAL_TYPE: symbol = Symbol.for('react.portal');
export const REACT_FRAGMENT_TYPE: symbol = Symbol.for('react.fragment');
export const REACT_STRICT_MODE_TYPE: symbol = Symbol.for('react.strict_mode');
export const REACT_PROFILER_TYPE: symbol = Symbol.for('react.profiler');
export const REACT_PROVIDER_TYPE: symbol = Symbol.for('react.provider');
export const REACT_CONTEXT_TYPE: symbol = Symbol.for('react.context');
export const REACT_FORWARD_REF_TYPE: symbol = Symbol.for('react.forward_ref');
export const REACT_SUSPENSE_TYPE: symbol = Symbol.for('react.suspense');
export const REACT_SUSPENSE_LIST_TYPE: symbol = Symbol.for(
  'react.suspense_list',
);
export const REACT_MEMO_TYPE: symbol = Symbol.for('react.memo');
export const REACT_LAZY_TYPE: symbol = Symbol.for('react.lazy');
export const REACT_SCOPE_TYPE: symbol = Symbol.for('react.scope');
export const REACT_DEBUG_TRACING_MODE_TYPE: symbol = Symbol.for(
  'react.debug_trace_mode',
);
export const REACT_OFFSCREEN_TYPE: symbol = Symbol.for('react.offscreen');
export const REACT_LEGACY_HIDDEN_TYPE: symbol = Symbol.for(
  'react.legacy_hidden',
);
export const REACT_CACHE_TYPE: symbol = Symbol.for('react.cache');
export const REACT_TRACING_MARKER_TYPE: symbol = Symbol.for(
  'react.tracing_marker',
);

export const REACT_MEMO_CACHE_SENTINEL: symbol = Symbol.for(
  'react.memo_cache_sentinel',
);

export const REACT_POSTPONE_TYPE: symbol = Symbol.for('react.postpone');

const MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
const FAUX_ITERATOR_SYMBOL = '@@iterator';

export function getIteratorFn(maybeIterable: ?any): ?() => ?Iterator<any> {
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
