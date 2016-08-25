/**
 * Copyright 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactCoroutine
 * @flow
 */

'use strict';

import type { ReactNodeList } from 'ReactTypes';

// The Symbol used to tag the special React types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var REACT_COROUTINE_TYPE =
  (typeof Symbol === 'function' && Symbol.for && Symbol.for('react.coroutine')) ||
  0xeac8;

var REACT_YIELD_TYPE =
  (typeof Symbol === 'function' && Symbol.for && Symbol.for('react.yield')) ||
  0xeac9;

type ReifiedYield = { continuation: Object, props: Object };
type CoroutineHandler<T> = (props: T, yields: Array<ReifiedYield>) => ReactNodeList;

export type ReactCoroutine = {
  $$typeof: Symbol | number,
  key: null | string,
  children: any,
  // This should be a more specific CoroutineHandler
  handler: (props: any, yields: Array<ReifiedYield>) => ReactNodeList,
  /* $FlowFixMe(>=0.31.0): Which is it? mixed? Or Object? Must match
   * `ReactYield` type.
   */
  props: mixed,
};
export type ReactYield = {
  $$typeof: Symbol | number,
  key: null | string,
  props: Object,
  continuation: mixed
};

exports.createCoroutine = function<T>(
  children : mixed,
  handler : CoroutineHandler<T>,
  props : T,
  key : ?string = null
) : ReactCoroutine {
  var coroutine = {
    // This tag allow us to uniquely identify this as a React Coroutine
    $$typeof: REACT_COROUTINE_TYPE,
    key: key == null ? null : '' + key,
    children: children,
    handler: handler,
    props: props,
  };

  if (__DEV__) {
    // TODO: Add _store property for marking this as validated.
    if (Object.freeze) {
      Object.freeze(coroutine.props);
      Object.freeze(coroutine);
    }
  }

  return coroutine;
};

exports.createYield = function(props : mixed, continuation : mixed, key : ?string = null) {
  var yieldNode = {
    // This tag allow us to uniquely identify this as a React Yield
    $$typeof: REACT_YIELD_TYPE,
    key: key == null ? null : '' + key,
    props: props,
    continuation: continuation,
  };

  if (__DEV__) {
    // TODO: Add _store property for marking this as validated.
    if (Object.freeze) {
      Object.freeze(yieldNode.props);
      Object.freeze(yieldNode);
    }
  }

  return yieldNode;
};

/**
 * Verifies the object is a coroutine object.
 */
exports.isCoroutine = function(object : mixed) : boolean {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_COROUTINE_TYPE
  );
};

/**
 * Verifies the object is a yield object.
 */
exports.isYield = function(object : mixed) : boolean {
  return (
    typeof object === 'object' &&
    object !== null &&
    object.$$typeof === REACT_YIELD_TYPE
  );
};

exports.REACT_YIELD_TYPE = REACT_YIELD_TYPE;
exports.REACT_COROUTINE_TYPE = REACT_COROUTINE_TYPE;
