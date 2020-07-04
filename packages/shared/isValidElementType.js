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
  REACT_FUNDAMENTAL_TYPE,
  REACT_RESPONDER_TYPE,
  REACT_SCOPE_TYPE,
  REACT_BLOCK_TYPE,
  REACT_SERVER_BLOCK_TYPE,
  REACT_LEGACY_HIDDEN_TYPE,
} from 'shared/ReactSymbols';

export default function isValidElementType(type: mixed) {
  if (typeof type === 'string' || typeof type === 'function') return true;

  // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).
  if (
    type === REACT_FRAGMENT_TYPE ||
    type === REACT_PROFILER_TYPE ||
    type === REACT_DEBUG_TRACING_MODE_TYPE ||
    type === REACT_STRICT_MODE_TYPE ||
    type === REACT_SUSPENSE_TYPE ||
    type === REACT_SUSPENSE_LIST_TYPE ||
    type === REACT_LEGACY_HIDDEN_TYPE
  ) {
    return true;
  }

  if (typeof type === 'object' && type !== null) {
    switch (type.$$typeof) {
      case REACT_LAZY_TYPE:
      case REACT_MEMO_TYPE:
      case REACT_PROVIDER_TYPE:
      case REACT_CONTEXT_TYPE:
      case REACT_FORWARD_REF_TYPE:
      case REACT_FUNDAMENTAL_TYPE:
      case REACT_RESPONDER_TYPE:
      case REACT_SCOPE_TYPE:
      case REACT_BLOCK_TYPE:
        return true;
      default:
        if (type[(0: any)] === REACT_SERVER_BLOCK_TYPE) return true;
    }
  }

  return false;
}
