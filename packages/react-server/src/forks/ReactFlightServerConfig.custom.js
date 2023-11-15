/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Request} from 'react-server/src/ReactFlightServer';

export * from '../ReactFlightServerConfigBundlerCustom';

export type Hints = any;
export type HintCode = any;
// eslint-disable-next-line no-unused-vars
export type HintModel<T: any> = any;

export const isPrimaryRenderer = false;

export const prepareHostDispatcher = () => {};

export const supportsRequestStorage = false;
export const requestStorage: AsyncLocalStorage<Request> = (null: any);

export function createHints(): any {
  return null;
}
