/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {Request} from 'react-server/src/ReactFlightServer';

export * from '../ReactFlightServerConfigStream';
export * from 'react-server-dom-webpack/src/ReactFlightServerConfigWebpackBundler';
export * from 'react-dom-bindings/src/server/ReactFlightServerConfigDOM';

// For now, we get this from the global scope, but this will likely move to a module.
export const supportsRequestStorage = typeof AsyncLocalStorage === 'function';
export const requestStorage: AsyncLocalStorage<Request> = supportsRequestStorage
  ? new AsyncLocalStorage()
  : (null: any);
