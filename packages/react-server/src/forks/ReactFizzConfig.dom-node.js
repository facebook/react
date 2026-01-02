/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {AsyncLocalStorage} from 'async_hooks';

import type {Request} from 'react-server/src/ReactFizzServer';

export * from 'react-dom-bindings/src/server/ReactFizzConfigDOM';

export * from 'react-client/src/ReactClientConsoleConfigServer';

export const supportsRequestStorage = true;
export const requestStorage: AsyncLocalStorage<Request | void> =
  new AsyncLocalStorage();

// AsyncLocalStorage.snapshot() captures the entire async context stack,
// preserving all AsyncLocalStorage contexts (including third-party ones like Next.js).
// This is available in Node.js 18.2.0+.
export const supportsAsyncContextSnapshot: boolean =
  // $FlowFixMe[prop-missing] - snapshot is not in Flow's types yet
  typeof AsyncLocalStorage.snapshot === 'function';

// Captures the current async context and returns a function that runs callbacks
// within that captured context. This preserves ALL AsyncLocalStorage contexts.
export function createAsyncContextSnapshot(): <T>(fn: () => T) => T {
  if (supportsAsyncContextSnapshot) {
    // $FlowFixMe[prop-missing] - snapshot is not in Flow's types yet
    return AsyncLocalStorage.snapshot();
  }
  // Fallback: just run the callback directly (no context preservation)
  return <T>(fn: () => T): T => fn();
}
