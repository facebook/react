/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function createPortal() {
  if (__DEV__) {
    console.error(
      'createPortal was called on the server. Portals are not currently' +
        ' supported on the server. Update your program to conditionally call' +
        ' createPortal on the client only.',
    );
  }
}

export function flushSync() {
  if (__DEV__) {
    console.error(
      'flushSync was called on the server. This is likely caused by a' +
        ' function being called during render or in module scope that was' +
        ' supposed to be called from an effect or event handler. On the' +
        ' server, flushSync does nothing.',
    );
  }
}
