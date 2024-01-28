/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export function loadChunk(url: string): Promise<mixed> {
  if (url.endsWith('.css')) {
    return Promise.resolve();
  } else {
    return __parcel__import__('.' + url);
  }
}
