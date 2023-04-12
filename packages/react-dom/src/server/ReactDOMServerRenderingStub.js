/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export {preinit, preload, preconnect, prefetchDNS} from '../ReactDOMFloat';

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
