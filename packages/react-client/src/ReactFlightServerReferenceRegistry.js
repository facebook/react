/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';

export type CallServerCallback = <A, T>(id: any, args: A) => Promise<T>;

type ServerReferenceId = any;

export const knownServerReferences: WeakMap<
  Function,
  {id: ServerReferenceId, bound: null | Thenable<Array<any>>},
> = new WeakMap();

export function createServerReference<A: Iterable<any>, T>(
  id: ServerReferenceId,
  callServer: CallServerCallback,
): (...A) => Promise<T> {
  const proxy = function (): Promise<T> {
    // $FlowFixMe[method-unbinding]
    const args = Array.prototype.slice.call(arguments);
    return callServer(id, args);
  };
  knownServerReferences.set(proxy, {id: id, bound: null});
  return proxy;
}
