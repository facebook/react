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
    // TODO: move this to a separate package
    const cssLoader = require('@parcel/runtime-js/src/helpers/browser/css-loader');
    return cssLoader(url);
  } else {
    return __parcel__import__('.' + url);
  }
}
