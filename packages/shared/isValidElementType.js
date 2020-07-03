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

  if (
    [
      REACT_FRAGMENT_TYPE,
      REACT_PROFILER_TYPE,
      REACT_DEBUG_TRACING_MODE_TYPE,
      REACT_STRICT_MODE_TYPE,
      REACT_SUSPENSE_TYPE,
      REACT_SUSPENSE_LIST_TYPE,
      REACT_LEGACY_HIDDEN_TYPE,
    ].indexOf(type) !== -1
  )
    return true;

  if (typeof type === 'object' && type !== null) {
    if (
      [
        REACT_LAZY_TYPE,
        REACT_MEMO_TYPE,
        REACT_PROVIDER_TYPE,
        REACT_CONTEXT_TYPE,
        REACT_FORWARD_REF_TYPE,
        REACT_FUNDAMENTAL_TYPE,
        REACT_RESPONDER_TYPE,
        REACT_SCOPE_TYPE,
        REACT_BLOCK_TYPE,
      ].indexOf(type.$$typeof) !== -1
    )
      return true;

    if (type[(0: any)] === REACT_SERVER_BLOCK_TYPE) return true;
  }

  return false;
}
