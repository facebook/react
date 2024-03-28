/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {Request} from 'react-server/src/ReactFlightServer';

export * from 'react-server-dom-parcel/src/ReactFlightServerConfigParcelBundler';
export * from 'react-dom-bindings/src/server/ReactFlightServerConfigDOM';

// For now, we get this from the global scope, but this will likely move to a module.
export const supportsRequestStorage = typeof AsyncLocalStorage === 'function';
export const requestStorage: AsyncLocalStorage<Request | void> = supportsRequestStorage
  ? new AsyncLocalStorage()
  : (null: any);

// We use the Node version but get access to async_hooks from a global.
import type {HookCallbacks, AsyncHook} from 'async_hooks';
export const createAsyncHook: HookCallbacks => AsyncHook =
  typeof async_hooks === 'object'
    ? async_hooks.createHook
    : function () {
        return ({
          enable() {},
          disable() {},
        }: any);
      };
export const executionAsyncId: () => number =
  typeof async_hooks === 'object' ? async_hooks.executionAsyncId : (null: any);
export * from '../ReactFlightServerConfigDebugNode';
