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
  $$location?: Error,
};

// eslint-disable-next-line no-unused-vars
export type ClientReference<T> = {
  $$typeof: symbol,
  $$id: string,
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
  exportName: string,
): ClientReference<T> {
  return Object.defineProperties(proxyImplementation, {
    $$typeof: {value: CLIENT_REFERENCE_TAG},
    $$id: {value: id + '#' + exportName},
  });
}

// $FlowFixMe[method-unbinding]
const FunctionBind = Function.prototype.bind;
// $FlowFixMe[method-unbinding]
const ArraySlice = Array.prototype.slice;
function bind(this: ServerReference<any>): any {
  // $FlowFixMe[unsupported-syntax]
  const newFn = FunctionBind.apply(this, arguments);
  if (this.$$typeof === SERVER_REFERENCE_TAG) {
    // $FlowFixMe[method-unbinding]
    const args = ArraySlice.call(arguments, 1);
    return Object.defineProperties((newFn: any), {
      $$typeof: {value: SERVER_REFERENCE_TAG},
      $$id: {value: this.$$id},
      $$bound: {value: this.$$bound ? this.$$bound.concat(args) : args},
      bind: {value: bind},
    });
  }
  return newFn;
}

export function registerServerReference<T: Function>(
  reference: T,
  id: string,
  exportName: string,
): ServerReference<T> {
  const $$typeof = {value: SERVER_REFERENCE_TAG};
  const $$id = {
    value: id + '#' + exportName,
    configurable: true,
  };
  const $$bound = {value: null, configurable: true};
  return Object.defineProperties(
    (reference: any),
    __DEV__
      ? {
          $$typeof,
          $$id,
          $$bound,
          $$location: {
            value: Error('react-stack-top-frame'),
            configurable: true,
          },
          bind: {value: bind, configurable: true},
        }
      : {
          $$typeof,
          $$id,
          $$bound,
          bind: {value: bind, configurable: true},
        },
  );
}
