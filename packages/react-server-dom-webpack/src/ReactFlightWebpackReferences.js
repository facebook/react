/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactClientValue} from 'react-server/src/ReactFlightServer';

export type ServerReference<T: Function> = T & {
  $$typeof: symbol,
  $$id: string,
  $$bound: null | Array<ReactClientValue>,
};

// eslint-disable-next-line no-unused-vars
export type ClientReference<T> = {
  $$typeof: symbol,
  $$id: string,
  $$async: boolean,
};

const CLIENT_REFERENCE_TAG = Symbol.for('react.client.reference');
const SERVER_REFERENCE_TAG = Symbol.for('react.server.reference');

export function isClientReference(reference: Object): boolean {
  return reference.$$typeof === CLIENT_REFERENCE_TAG;
}

export function isServerReference(reference: Object): boolean {
  return reference.$$typeof === SERVER_REFERENCE_TAG;
}

export function registerClientReference<T>(
  proxyImplementation: any,
  id: string,
  async: boolean,
): ClientReference<T> {
  return Object.defineProperties(proxyImplementation, {
    $$typeof: {value: CLIENT_REFERENCE_TAG},
    $$id: {value: id},
    $$async: {value: async},
  });
}

// $FlowFixMe[method-unbinding]
const FunctionBind = Function.prototype.bind;
// $FlowFixMe[method-unbinding]
const ArraySlice = Array.prototype.slice;
function bind(this: ServerReference<any>) {
  // $FlowFixMe[unsupported-syntax]
  const newFn = FunctionBind.apply(this, arguments);
  if (this.$$typeof === SERVER_REFERENCE_TAG) {
    const args = ArraySlice.call(arguments, 1);
    newFn.$$typeof = SERVER_REFERENCE_TAG;
    newFn.$$id = this.$$id;
    newFn.$$bound = this.$$bound ? this.$$bound.concat(args) : args;
  }
  return newFn;
}

export function registerServerReference<T>(
  reference: ServerReference<T>,
  id: string,
): ServerReference<T> {
  return Object.defineProperties((reference: any), {
    $$typeof: {value: SERVER_REFERENCE_TAG},
    $$id: {value: id},
    $$bound: {value: null},
    bind: {value: bind},
  });
}
