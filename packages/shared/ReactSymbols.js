/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
const hasSymbol = typeof Symbol === 'function' && Symbol.for;

function createSymbol(symbolKey: string, numberKey: number) {
  return hasSymbol ? Symbol.for(symbolKey) : numberKey;
}

export const REACT_ELEMENT_TYPE = createSymbol('react.element', 0xeac7);
export const REACT_PORTAL_TYPE = createSymbol('react.portal', 0xeaca);
export const REACT_FRAGMENT_TYPE = createSymbol('react.fragment', 0xeacb);
export const REACT_STRICT_MODE_TYPE = createSymbol('react.strict_mode', 0xeacc);
export const REACT_PROFILER_TYPE = createSymbol('react.profiler', 0xead2);
export const REACT_PROVIDER_TYPE = createSymbol('react.provider', 0xeacd);
export const REACT_CONTEXT_TYPE = createSymbol('react.context', 0xeace);
// TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary
// (unstable) APIs that have been removed. Can we remove the symbols?
export const REACT_ASYNC_MODE_TYPE = createSymbol('react.async_mode', 0xeacf);
export const REACT_CONCURRENT_MODE_TYPE = createSymbol(
  'react.concurrent_mode',
  0xeacf,
);
export const REACT_FORWARD_REF_TYPE = createSymbol('react.forward_ref', 0xead0);
export const REACT_SUSPENSE_TYPE = createSymbol('react.suspense', 0xead1);
export const REACT_SUSPENSE_LIST_TYPE = createSymbol(
  'react.suspense_list',
  0xead8,
);
export const REACT_MEMO_TYPE = createSymbol('react.memo', 0xead3);
export const REACT_LAZY_TYPE = createSymbol('react.lazy', 0xead4);
export const REACT_FUNDAMENTAL_TYPE = createSymbol('react.fundamental', 0xead5);
export const REACT_RESPONDER_TYPE = createSymbol('react.responder', 0xead6);

const MAYBE_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
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
