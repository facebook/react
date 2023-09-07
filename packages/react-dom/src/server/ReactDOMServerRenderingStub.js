/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export {
  preinit,
  preinitModule,
  preload,
  preloadModule,
  preconnect,
  prefetchDNS,
} from '../shared/ReactDOMFloat';
export {
  useFormStatus as experimental_useFormStatus,
  useFormState as experimental_useFormState,
} from 'react-dom-bindings/src/shared/ReactDOMFormActions';

export function createPortal() {
  throw new Error(
    'createPortal was called on the server. Portals are not currently' +
      ' supported on the server. Update your program to conditionally call' +
      ' createPortal on the client only.',
  );
}

export function flushSync() {
  throw new Error(
    'flushSync was called on the server. This is likely caused by a' +
      ' function being called during render or in module scope that was' +
      ' intended to be called from an effect or event handler. Update your' +
      ' to not call flushSync no the server.',
  );
}

// on the server we just call the callback because there is
// not update mechanism. Really this should not be called on the
// server but since the semantics are generally clear enough we
// can provide this trivial implementation.
function batchedUpdates<A, R>(fn: A => R, a: A): R {
  return fn(a);
}

export {batchedUpdates as unstable_batchedUpdates};
